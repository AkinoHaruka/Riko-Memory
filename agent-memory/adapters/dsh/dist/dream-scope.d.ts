export interface DreamChildBinding {
    runnerId: string;
    jobId: string;
    generation: number;
    phase: "extract" | "redecision" | "adjudicate" | "consolidate";
    parentAgentId: string;
    readToolsEnabled: boolean;
}
export declare function withDreamChildBinding<T>(binding: DreamChildBinding, action: () => T): T;
export declare function currentDreamChildBinding(): DreamChildBinding | undefined;
