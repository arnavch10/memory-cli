import type { Configuration } from "../../commands/run";
import type { ToolBuffer } from "../anthropic/buffer";
import { extractTurnActivity } from "../anthropic/extract";
import { formatActions } from "../anthropic/format";
import { createActionsSkeleton } from "../skeleton";

export type AnthropicTokenUsage = {
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    totalTokens: number;
};

const totals: AnthropicTokenUsage = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
};


const taskTotals: AnthropicTokenUsage = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0, 
}

export async function accumulateStream(stream: ReadableStream, config: Configuration, buffer: ToolBuffer) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let raw = "";


    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
    }

    // turn activity
    const activity = extractTurnActivity(raw);
    totals.inputTokens += activity.inputTokens + activity.cacheReadTokens + activity.cacheCreationTokens;
    totals.outputTokens += activity.outputTokens;
    totals.cachedInputTokens += activity.cacheReadTokens;
    // taskTotal
    taskTotals.inputTokens += activity.inputTokens + activity.cacheReadTokens + activity.cacheCreationTokens;
    taskTotals.outputTokens += activity.outputTokens;
    taskTotals.cachedInputTokens += activity.cacheReadTokens;
    buffer.addToolCalls(activity.toolCalls, activity.reply);

    console.log("=== CLAUDE TOKEN USAGE ===");
    console.log("This request input:", activity.inputTokens);
    console.log("This request output:", activity.outputTokens);
    console.log("Total input:", totals.inputTokens);
    console.log("Total output:", totals.outputTokens);
    console.log(
        "Total tokens:",
        totals.inputTokens + totals.outputTokens
    );

    console.log("=== TASK TOTAL ===");
    console.log("input:", taskTotals.inputTokens, "(cached:", taskTotals.cachedInputTokens + ")");
    console.log("output:", taskTotals.outputTokens);


    for (const t of activity.toolCalls) {
        console.log("TOOL:", t.name, t.input?.file_path ?? t.input?.command ?? "");
    }

    // task is over → flush and store, right now
    if (activity.stopReason === "end_turn") {
        const taskPrompt = buffer.getPrompt();
        buffer.debug();
        const batch = buffer.flush();
        taskTotals.inputTokens = 0;
        taskTotals.cachedInputTokens = 0;
        taskTotals.outputTokens = 0;

        if (!taskPrompt) return;                    // no known task — nothing to file this under
        if (!batch.length && !activity.reply) return; // nothing happened




        try {

            // create ctags skeleton from batch
            const actionSkeleton = await createActionsSkeleton(batch);
            const text = formatActions(taskPrompt, activity.reply, actionSkeleton);
            console.log("=== STORING ===\n" + text);


            const res = await fetch(`http://${config.memory.host}:${config.memory.port}/memory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: taskPrompt, response: text, source_agent: "claude_code" })
            });
            if (!res.ok) throw new Error(`store failed: ${res.status}`);
            console.log("memory logged :)");
        } catch (e) {
            console.log("store failed", e);
        }
    }
}