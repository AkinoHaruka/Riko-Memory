import type { UserMessage } from "@deepseek-ai/dsh-llm";
import type { Agent } from "@deepseek-ai/dsh-agent";
import type { PreStepDecision } from "@deepseek-ai/dsh-agent";
import type { MemoryClient } from "./client.js";
import { type Logger } from "./events.js";
declare module "@deepseek-ai/dsh-llm" {
    interface MessageSourceMap {
        /** 记忆上下文注入：producer 自有 kind（v4 格式要求），事件线拒绝其为用户证据。 */
        "agent-memory": {
            kind: "agent-memory";
            form: "recall" | "resident" | "retrieved";
        };
    }
}
export declare const PLUGIN_KIND = "agent-memory";
/** Soul system section 唯一具名（doc6/03 §1）。 */
export declare const SOUL_SECTION_NAME = "agent-memory:soul";
/** Soul section 排序：在官方 persona suffix（10200）之后，不覆盖官方布局。 */
export declare const SOUL_SECTION_ORDER = 10300;
export interface PreStepPayload {
    agent: Agent;
    messages: UserMessage[];
    signal: AbortSignal;
}
/** 只选最后一条 source.kind==='user' 的原始用户消息。 */
export declare function latestOriginalUserText(messages: readonly UserMessage[]): string;
export declare function makePreStepHook(client: MemoryClient, logger: Logger, composeTimeoutMs: number): (payload: PreStepPayload, next: () => Promise<PreStepDecision>) => Promise<PreStepDecision>;
/** XML 数据边界内的文本转义（doc6/11 §5：正文作为数据，不得突破包裹结构）。 */
export declare function escapeXmlData(text: string): string;
/**
 * D6 v6：`system-prompt/assemble` waterfall 监听（doc6/03 §1、doc6/06 §3）。
 * 事件签名（官方 @477b4f4）：`(assembly, context, next)`，返回值 authoritative。
 * 先 `next()` 让官方监听器完成，再对返回的 assembly 追加唯一
 * `agent-memory:soul` section（interpolate:false，不 complete，order 在官方
 * persona suffix 之后）；GET /v1/soul 受 context.signal 与 soulTimeoutMs 共同
 * 取消；超时/离线/取消不注入、不缓存旧正文（删除/改版下一步生效）；空正文
 * 不产生空 section。
 */
/** 部署级稳定 agent ID（doc6/03 §1）；空则回退会话 ID（人格按会话隔离）。 */
export declare function makeSoulAssembleHook(client: MemoryClient, logger: Logger, soulTimeoutMs: number, disabled: () => boolean, agentName: string): (assembly: {
    sections: Array<Record<string, unknown>>;
}, context: {
    agent?: {
        id?: unknown;
        session?: {
            header?: {
                origin?: unknown;
                parentSession?: unknown;
            };
        };
    };
    signal?: AbortSignal;
}, next: () => Promise<{
    sections: Array<Record<string, unknown>>;
}>) => Promise<{
    sections: Array<Record<string, unknown>>;
}>;
/**
 * D6 v6：`agent/pre-step` bundle 前插 hook（doc6/06 §3）。
 * 空 query 仍取 resident；resident/retrieved 非空正文各成一条独立、有来源的
 * user-role 消息前插在原始用户正文之前；离线跳过注入，跟随 DSH signal 取消；同 decision 去重。
 */
/** 部署级稳定 agent ID（doc6/03 §1）；空则回退会话 ID。 */
export declare function makeBundleHook(client: MemoryClient, logger: Logger, agentName: string): (payload: PreStepPayload, next: () => Promise<PreStepDecision>) => Promise<PreStepDecision>;
