import type { ToolDefinition } from "@deepseek-ai/dsh-tools";
import type { MemoryClient } from "./client.js";
import type { EventPipeline, Logger } from "./events.js";
export interface ToolServices {
    client: MemoryClient;
    pipeline: EventPipeline;
    logger: Logger;
    hostId: string;
    writeTimeoutMs: number;
}
export interface AgentLike {
    id: string;
    session: {
        id: string;
    };
}
export interface ToolExecLike {
    agent?: AgentLike;
    signal: AbortSignal;
}
export declare function buildMemoryTools(svc: ToolServices): ToolDefinition[];
