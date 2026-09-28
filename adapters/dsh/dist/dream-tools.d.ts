import type { ToolDefinition } from "@deepseek-ai/dsh-tools";
import type { MemoryClient } from "./client.js";
import type { DreamChildBinding } from "./dream-scope.js";
export declare function buildDreamReadTools(client: MemoryClient, binding: DreamChildBinding, childAgentId: string): ToolDefinition[];
