import type { MemoryClient } from "./client.js";
import { Spool } from "./spool.js";
export interface Logger {
    warn(message: string): void;
    error(message: string): void;
    info?(message: string): void;
}
/** 内核 ingest 请求（doc/12 §3）。 */
export interface EventWireRequest extends Record<string, unknown> {
    origin: {
        host_id: string;
        agent_id: string;
        session_id: string;
    };
    event_seq: number;
    role: string;
    source_kind: string;
    occurred_at: string;
    content: string;
}
export interface LatestUserMessage {
    seq: number;
    messageId: string;
    content: string;
}
/** 定点缺口对账（由 index.ts 用官方 ctx.sessionQuery.readEvent 实现）。 */
export interface GapChecker {
    /** 返回该 session 指定 seq 的原始事件；不存在/不可读返回 undefined。 */
    readEvent(sessionId: string, seq: number): Promise<unknown>;
}
/** Child sessions are isolated from the user's ordinary memory context as well as L0 capture. */
export declare function isSubagentSessionHeader(header: {
    origin?: unknown;
    parentSession?: unknown;
} | undefined): boolean;
/** L0 only accepts top-level host sessions; child/fork sessions are not user evidence. */
export declare function isCapturableSessionHeader(header: {
    origin?: unknown;
    parentSession?: unknown;
} | undefined): boolean;
export declare class EventPipeline {
    private readonly spool;
    private readonly client;
    private readonly logger;
    private readonly hostId;
    private readonly captureEnabled;
    private readonly queue;
    private queueBytes;
    private stopped;
    private captureBroken;
    private writerWakeup;
    /** 每 session 发送链。 */
    private readonly chains;
    private readonly chainPending;
    /** 每 session 已排队（含已发）的最后正文证据 seq。 */
    private readonly lastBodySeq;
    /** 每 session 最新 user/user 消息（按 seq 单调更新）。 */
    private readonly latestUser;
    private readonly evidenceIds;
    private readonly waiters;
    private unauthorizedPaused;
    private protocolOkAt;
    private readonly permanentlyBroken;
    /** 每 session 距上次 flush 已接受的正文事件数与估算字节（doc4/03 §5；不持久化，
     * 重启后未 ack 操作靠 spool 复送，服务端按实际已收证据分窗）。 */
    private readonly segEvents;
    private readonly segBytes;
    constructor(spool: Spool, client: MemoryClient, logger: Logger, hostId: string, captureEnabled: boolean);
    /** session/event 回调（同步）：验证 → opId → 有界入队 → 立即返回。 */
    observeSessionEvent(sessionId: string, event: unknown): void;
    latestUserOf(sessionId: string): LatestUserMessage | undefined;
    evidenceIdFor(sessionId: string, seq: number): string | undefined;
    /** 等待指定用户事件的内核 receipt（受 timeoutMs 与外部 signal 限制）。 */
    awaitEvidenceId(sessionId: string, seq: number, timeoutMs: number, signal?: AbortSignal): Promise<string | undefined>;
    /** 启动：重建发送队列（重启重放）→ 已知 session 定点对账。 */
    start(gapChecker?: GapChecker): Promise<void>;
    /** 卸载：先给在途队列与发送链最多 5 秒完成（含 turn/end flush），再停止接收。
     * 此前先置 stopped 再等待，drainChain 立即返回，one-shot 进程退出竞态把
     * flush 留在 spool，记忆可用性滞后一轮（doc-handoff/06 F4，2026-09-25）。
     * 内核离线时在途链不会 settle，按 deadline 收尾，未 ack 保留 spool 供重放。 */
    dispose(): Promise<void>;
    /** 入内存队列；返回是否被接受。满时记 CAPTURE_GAP 并拒收（调用方不得推进光标）。 */
    private push;
    private isPending;
    private runWriter;
    private enqueueToChain;
    private enqueueExisting;
    private enqueueFlush;
    /**
     * Compact trigger enters the same durable per-session chain after a flush.
     * Thus offline replay sends all preceding L0 receipts before memoryd freezes
     * the Dream input. The compaction summary itself is never sent as evidence.
     */
    private enqueueCompactionTrigger;
    private persistQueuedToSpool;
    private drainChain;
    private retryDelayMs;
    private retryLater;
    /** 连通后先核 /v1/version 的 protocol_version=1，再发送；不兼容即暂停出站。 */
    private ensureProtocol;
    private reconcileGaps;
    private mapEvent;
    private removeWaiter;
    private resolveWaiters;
    private rejectAllWaiters;
}
