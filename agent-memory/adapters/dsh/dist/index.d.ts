import type { Context } from "@deepseek-ai/cordis";
import { type AgentLike, type ToolExecLike } from "./tools.js";
export declare const name = "agent-memory";
export declare const inject: string[];
export type Config = Record<string, unknown>;
/** Cordis 插件入口：apply 必须同步完成装载契约，异步启动错误要可见。 */
export declare function apply(ctx: Context, config?: Config): void;
export type { AgentLike, ToolExecLike };
