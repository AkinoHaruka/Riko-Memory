/**
 * DSH 宿主插件入口（doc2/02，官方 Cordis 形状已核对 @477b4f4）。
 *
 * - 导出 name / inject / apply(ctx, config)：由官方 profile + --patch 装载。
 * - token 用 ESM import 读取，只保存在进程内；日志不输出 token/hash/正文/密钥。
 * - captureEnabled 只控 L0 捕获；injectionEnabled 只控注入；toolsEnabled 只控工具注册。
 * - 卸载经 ctx.effect：停止接收 → 真实等待在途链 ≤5s → 释放句柄；未 ack spool 保留。
 * - daemon 离线仍捕获落 spool；恢复后先核 protocol_version=1 再按序发送。
 */
import { readFileSync } from "node:fs";
import { DreamRunner } from "./dream-runner.js";
import { currentDreamChildBinding } from "./dream-scope.js";
import { buildDreamReadTools } from "./dream-tools.js";
import { makeBundleHook, makePreStepHook, makeSoulAssembleHook } from "./recall.js";
import { MemoryClient } from "./client.js";
import { loadConfig } from "./config.js";
import { EventPipeline, isCapturableSessionHeader } from "./events.js";
import { Spool } from "./spool.js";
import { buildMemoryTools } from "./tools.js";
export const name = "agent-memory";
export const inject = ["tools", "subagents"];
/** D6 capability（doc6/06 §1）：v6 注入（Soul section + bundle 前插）所需。 */
const REQUIRED_CAPABILITY = "context_bundle_v1";
function makeLogger(ctx) {
    const anyCtx = ctx;
    const l = anyCtx.logger;
    return {
        warn: (m) => l?.warn(m),
        error: (m) => l?.error(m),
        info: (m) => l?.info(m),
    };
}
function readToken(path) {
    // ESM import（G-02 修复）：禁止裸 require。
    const token = readFileSync(path, "utf8").trim();
    if (!token)
        throw new Error(`agent-memory: 令牌文件为空: ${path}`);
    return token;
}
class AgentMemoryPlugin {
    ctx;
    logger;
    client;
    spool;
    pipeline;
    dreamRunner;
    disposed = false;
    /** 装载期可降级：握手缺 capability 时停用 v6（doc6/06 §1 不静默落回）。 */
    cfg;
    constructor(ctx, rawConfig) {
        this.ctx = ctx;
        this.cfg = loadConfig(rawConfig);
        this.logger = makeLogger(ctx);
        const token = readToken(this.cfg.userTokenFile);
        this.client = new MemoryClient({
            baseUrl: this.cfg.memoryUrl,
            token,
            writeTimeoutMs: this.cfg.writeTimeoutMs,
            composeTimeoutMs: this.cfg.composeTimeoutMs,
            soulTimeoutMs: this.cfg.soulTimeoutMs,
        });
        this.spool = new Spool(this.cfg.spoolDir, this.cfg.spoolLimitBytes);
        this.pipeline = new EventPipeline(this.spool, this.client, this.logger, this.cfg.hostId, this.cfg.captureEnabled);
        this.dreamRunner = new DreamRunner(this.ctx, this.client, this.logger, this.cfg.hostId, () => this.disposed);
    }
    async start() {
        const gapChecker = this.resolveGapChecker();
        await this.pipeline.start(gapChecker);
        // DSH 自身持久 Agent 的 pre-step 是 runner 可见的父 Agent seam。
        // runner 只从一个仍登记的父 Agent 启动，子 Agent 工具集为空。
        this.ctx.on("agent/pre-step", ((payload, next) => {
            this.dreamRunner.start(payload.agent);
            return next();
        }));
        if (this.cfg.contextBundleEnabled)
            await this.negotiateContextBundle();
        if (this.cfg.captureEnabled) {
            // session/event 是提交后的同步受保护通知；回调只做有界入队（doc2/03 §2）。
            this.ctx.on("session/event", ((session, event) => {
                // DSH 的子 Agent prompt 也会以 source.kind='user' 写入自己的 session。
                // 只按消息 source 判定会把内部 Dream 指令误记成用户 L0；header 是
                // 官方持久 session 的来源分类，fork 同样排除以免重复摄入继承事件。
                if (!isCapturableSessionHeader(session.header))
                    return;
                this.pipeline.observeSessionEvent(String(session.id), event);
            }));
        }
        if (this.cfg.contextBundleEnabled) {
            // D6 v6 注入（doc6/06 §3）：Soul 走 assemble waterfall；resident/retrieved
            // 走 pre-step 前插。同一步不再调用旧 compose（不双调）。
            this.registerSoulAssemble();
            this.registerBundlePreStep();
        }
        else if (this.cfg.injectionEnabled) {
            const hook = makePreStepHook(this.client, this.logger, this.cfg.composeTimeoutMs);
            this.ctx.on("agent/pre-step", (async (payload, next) => {
                return hook(payload, next);
            }));
        }
        // AsyncLocalStorage tags only the exact child created by DreamRunner.
        // Install read-only tools in that child agent scope before its first prompt;
        // ordinary tools remain filtered by SubagentStartRequest.toolFilter.
        this.ctx.on("agent/created", async (payload) => {
            const binding = currentDreamChildBinding();
            const child = payload.agent;
            if (!binding || String(child.session?.header?.origin) !== "subagent"
                || child.session?.header?.parentSession === undefined
                || binding.parentAgentId === String(child.id))
                return;
            const scoped = child.ctx;
            if (!scoped.tools || typeof scoped.tools.register !== "function") {
                throw new Error("agent-memory: DSH Dream child 没有 scoped tools.register；拒绝以全局工具替代");
            }
            for (const tool of buildDreamReadTools(this.client, binding, String(child.id))) {
                scoped.tools.register(tool);
            }
        });
        if (this.cfg.toolsEnabled) {
            const tools = buildMemoryTools({
                client: this.client,
                pipeline: this.pipeline,
                logger: this.logger,
                hostId: this.cfg.hostId,
                writeTimeoutMs: this.cfg.writeTimeoutMs,
            });
            const registry = this.ctx.tools;
            for (const tool of tools) {
                registry.register(tool);
            }
        }
        this.logger.info?.(`agent-memory: 已加载 capture=${this.cfg.captureEnabled} injection=${this.cfg.injectionEnabled} `
            + `tools=${this.cfg.toolsEnabled} contextBundle=${this.cfg.contextBundleEnabled}`);
    }
    /**
     * capability 握手（doc6/06 §1）：contextBundleEnabled 时核 `context_bundle_v1`。
     * 缺失时：require=true → throw 拒绝装载（fail loud）；否则停用 v6 并**连同旧
     * 注入一并停用**（不静默落回旧"两条指令"模式），报 error 诊断。
     */
    async negotiateContextBundle() {
        const r = await this.client.version();
        const caps = r.body?.capabilities;
        const has = Array.isArray(caps) && caps.includes(REQUIRED_CAPABILITY);
        if (has)
            return;
        const detail = `memoryd 缺少 capability ${REQUIRED_CAPABILITY}（status=${r.status}）；v6 注入不可用`;
        if (this.cfg.requireContextBundle) {
            throw new Error(`${detail}；requireContextBundle=true，拒绝装载（不落回旧注入模式）`);
        }
        this.cfg = { ...this.cfg, contextBundleEnabled: false, injectionEnabled: false };
        this.logger.error?.(`agent-memory: ${detail}；已停用全部自动注入（capture 与工具不受影响）`);
    }
    /** 注册 system-prompt/assemble waterfall：唯一 Soul system section。 */
    registerSoulAssemble() {
        const hook = makeSoulAssembleHook(this.client, this.logger, this.cfg.soulTimeoutMs, () => this.disposed, this.cfg.agentName);
        // system-prompt/assemble 的分发 subject 是 context.scope（agent scope，doc6/03 §1
        // 预核）。每个 agent 创建时在其 scope ctx 上注册 scoped listener——官方
        // preset/persona 测试的同款模式；全局注册实测不触发（根因见交付记录）。
        this.ctx.on("agent/created", async (payload) => {
            const agentCtx = payload.agent.ctx;
            agentCtx.on("system-prompt/assemble", async (assembly, context, next) => {
                return hook(assembly, context, next);
            });
        });
    }
    /** 注册 agent/pre-step：bundle 的 resident/retrieved 前插（doc6/06 §3）。 */
    registerBundlePreStep() {
        const hook = makeBundleHook(this.client, this.logger, this.cfg.agentName);
        this.ctx.on("agent/pre-step", (async (payload, next) => {
            return hook(payload, next);
        }));
    }
    /** 官方异步定点读取：已知 session 的缺口对账用（doc2/03 §2 恢复边界）。 */
    resolveGapChecker() {
        const anyCtx = this.ctx;
        const sessionQuery = anyCtx.get?.("sessionQuery");
        if (!sessionQuery || typeof sessionQuery.readEvent !== "function")
            return undefined;
        return {
            readEvent: async (sessionId, seq) => {
                try {
                    const window = await sessionQuery.readEvent({ sessionId: sessionId, seq: seq });
                    return window.target;
                }
                catch {
                    return undefined;
                }
            },
        };
    }
    /** 真实收尾：等待在途发送链最多 5 秒，保留未 ack spool，释放文件句柄。 */
    async dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        await this.dreamRunner.dispose();
        await this.pipeline.dispose();
        this.spool.dispose();
    }
}
/** Cordis 插件入口：apply 必须同步完成装载契约，异步启动错误要可见。 */
export function apply(ctx, config = {}) {
    const plugin = new AgentMemoryPlugin(ctx, config);
    // ctx.effect：卸载时由宿主回收；dispose 返回 Promise，由 Cordis 等待真实收尾。
    ctx.effect(() => () => {
        void plugin.dispose().catch((e) => {
            // 收尾失败只记录：未 ack spool 已保留，不影响 DSH。
            const anyCtx = ctx;
            anyCtx.logger?.error(`agent-memory: 卸载收尾异常: ${String(e)}`);
        });
    });
    plugin.start().catch((e) => {
        const anyCtx = ctx;
        anyCtx.logger?.error(`agent-memory: 启动失败: ${e instanceof Error ? e.message : String(e)}`);
        throw e;
    });
}
//# sourceMappingURL=index.js.map