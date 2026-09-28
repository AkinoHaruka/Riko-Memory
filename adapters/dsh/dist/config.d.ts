/**
 * 插件配置（doc2/02 §3）。全部字段在装载时校验，非法即拒绝加载。
 * token 绝不直接写配置：userTokenFile 指向 `memoryd principal add` 生成的文件。
 */
export interface AdapterConfig {
    /** Rust 内核基地址。只允许 http://127.0.0.1 / localhost / [::1]，禁止用户信息、查询串、路径片段。 */
    memoryUrl: string;
    /** memoryd principal add 生成的令牌文件（必须存在、可读）。 */
    userTokenFile: string;
    /** 本机持久 spool 目录（必填绝对路径，不在上游仓库源码树内）。 */
    spoolDir: string;
    /** 当前 DSH 安装的稳定来源 ID：非空、最长 256 字符；由安装持久提供。 */
    hostId: string;
    /** 上下文 compose 调用时限。默认 500ms。 */
    composeTimeoutMs: number;
    /** 单次 HTTP 写时限。默认 3000ms。 */
    writeTimeoutMs: number;
    /** L0 事件捕获与 flush。默认 true。只控制本行为，不影响工具与注入。 */
    captureEnabled: boolean;
    /** pre-step 自动注入。默认 true。 */
    injectionEnabled: boolean;
    /** 注册用户记忆工具。默认 true。Dream 子 Agent 不使用此工具集。 */
    toolsEnabled: boolean;
    /** 本地 spool 上限（events+receipts 总保留量）。默认 100 MiB。 */
    spoolLimitBytes: number;
    /**
     * D6 v6 注入总开关（doc6/06 §1）：Soul system section + context/bundle 前插。
     * 默认 false；启用时启动握手核 capability `context_bundle_v1`，且不再注册旧
     * compose 注入（不同一步双调，doc6/06 §3）。
     */
    contextBundleEnabled: boolean;
    /**
     * 握手缺 capability 时的策略：true=拒绝装载（fail loud，不落回旧模式）；
     * false=停用 v6 注入并连旧注入一并停用，报 error 诊断（不静默）。
     */
    requireContextBundle: boolean;
    /** GET /v1/soul 时限（doc6/06 §3：默认 300ms）。 */
    soulTimeoutMs: number;
    /**
     * 部署级稳定 agent ID（doc6/03 §1「本进程配置的宿主 Agent ID」）。Soul 按
     * (tenant,user,agent_id) 隔离，DSH 的 agent.id 是随机会话 ID（session-*），
     * 跨会话不稳。启用 v6 context bundle 时必须配置稳定值（如 'agent-a'）；
     * 不允许回退到随机会话 ID，避免 Soul 随会话漂移。
     */
    agentName: string;
}
export declare function loadConfig(raw: unknown): AdapterConfig;
