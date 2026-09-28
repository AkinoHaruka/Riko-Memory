/**
 * Rust 内核 HTTP 客户端（doc/12 协议 v1）。
 * 令牌只在内存中持有；compose/write/Soul 超时来自插件配置，bundle 跟随调用方取消且无固定延迟预算；
 * 日志不输出令牌与正文。
 * 错误分类（doc2/03 §3）：unauthorized(401) / permanent(400,409) / offline(网络、超时、429、5xx)。
 */
export type FailureClass = "ok" | "unauthorized" | "permanent" | "offline";
export interface ClientConfig {
    baseUrl: string;
    token: string;
    writeTimeoutMs: number;
    composeTimeoutMs: number;
    soulTimeoutMs: number;
}
export interface ApiResult {
    status: number;
    body: unknown;
    requestId?: string;
    failure: FailureClass;
}
export declare class MemoryClient {
    private readonly cfg;
    constructor(cfg: ClientConfig);
    private post;
    private get;
    /** 启动握手（doc6/06 §1）：读取 capabilities 数组。 */
    version(): Promise<ApiResult>;
    recordEvent(request: Record<string, unknown>): Promise<ApiResult>;
    flush(request: Record<string, unknown>): Promise<ApiResult>;
    dreamTrigger(request: Record<string, unknown>): Promise<ApiResult>;
    dreamRunnerHeartbeat(request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    dreamRunnerClaim(request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    dreamRunnerLease(request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    dreamSubmitCandidates(jobId: string, request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    dreamSubmitAdjudication(jobId: string, request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    dreamSubmitConsolidation(jobId: string, request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    dreamRunnerFailure(request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    dreamRead(jobId: string, request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    compose(request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    /** GET /v1/soul（doc6/06 §2）：当前 agent 的用户编辑人格；不存在返回 version 0。 */
    soul(agentId: string, signal?: AbortSignal): Promise<ApiResult>;
    /** POST /v1/context/bundle（doc6/06 §2）：resident + retrieved 分段与诊断。 */
    contextBundle(request: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult>;
    search(request: Record<string, unknown>): Promise<ApiResult>;
    getMemory(memoryId: string): Promise<ApiResult>;
    remember(request: Record<string, unknown>): Promise<ApiResult>;
    correct(memoryId: string, request: Record<string, unknown>): Promise<ApiResult>;
    forget(memoryId: string, request: Record<string, unknown>): Promise<ApiResult>;
    retire(memoryId: string, request: Record<string, unknown>): Promise<ApiResult>;
    restore(memoryId: string, request: Record<string, unknown>): Promise<ApiResult>;
}
