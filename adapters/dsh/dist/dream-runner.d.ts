import type { Context } from "@deepseek-ai/cordis";
import type { Agent } from "@deepseek-ai/dsh-agent";
import type { MemoryClient } from "./client.js";
import type { Logger } from "./events.js";
/** One plugin-process resident loop. It never stores job truth outside memoryd. */
export declare class DreamRunner {
    private readonly ctx;
    private readonly client;
    private readonly logger;
    private readonly hostId;
    private readonly onDispose;
    private readonly runnerId;
    private controller;
    private task;
    private readonly childAgentIds;
    private disposed;
    private lastDiagnosticAt;
    constructor(ctx: Context, client: MemoryClient, logger: Logger, hostId: string, onDispose: () => boolean);
    start(agent: Agent): void;
    dispose(): Promise<void>;
    private validParent;
    private run;
    private execute;
    private submit;
    private reportFailure;
    private diagnostic;
}
