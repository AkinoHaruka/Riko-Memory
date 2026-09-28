export type SpoolOpKind = "event" | "flush" | "dream";
export interface SpooledOp {
    /** 操作唯一键 = <host>/<session>/<seq 或 flush:through>；内核幂等键来源不变。 */
    opId: string;
    op: SpoolOpKind;
    /** POST 请求正文（不含令牌）。 */
    request: Record<string, unknown>;
}
export interface Receipt {
    opId: string;
    kind: SpoolOpKind;
    /** 仅来自内核响应；旧 acked.jsonl 行没有。 */
    evidenceId?: string;
    at: string;
}
export declare class SpoolLimitError extends Error {
}
export declare class Spool {
    private readonly limitBytes;
    private readonly eventsPath;
    private readonly receiptsPath;
    private readonly legacyAckedPath;
    private readonly cursorsPath;
    private readonly acked;
    private bytes;
    private fd;
    /** 每 session 已落盘（spool 已写）的最大正文证据 seq。 */
    private cursors;
    constructor(dir: string, limitBytes?: number);
    private loadReceipts;
    /** v1 旧 acked.jsonl：仅"已确认过"语义，无 evidence_id（doc2/03 §2）。 */
    private loadLegacyAcked;
    private loadCursors;
    /** 追加并刷新（fsync）。落盘成功后才更新 session 光标。失败抛错，由调用方停止捕获。 */
    append(op: SpooledOp, sessionId: string, bodySeq: number | undefined): void;
    /** 内核 200/201/202 确认后持久化 receipt（含 evidence_id 时回填映射）。 */
    markAcked(opId: string, kind: SpoolOpKind, evidenceId: string | undefined): void;
    isAcked(opId: string): boolean;
    receiptOf(opId: string): Receipt | undefined;
    /** 启动重放：按原序返回未 ack 的操作。 */
    pending(): SpooledOp[];
    cursorOf(sessionId: string): number;
    knownSessions(): string[];
    /** 原子写光标（临时文件 + 替换）。 */
    private persistCursors;
    dispose(): void;
}
