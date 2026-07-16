import type { Configuration } from "../commands/run";
import type { ToolBuffer } from "./buffer";
import { extractReplyText, extractTurnActivity } from "./extract";
export async function accumulateStream(stream: ReadableStream, prompt: string, config: Configuration, buffer: ToolBuffer, response?: string, source_agent?: string) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let raw = "";
    
    while(true) {

        const { done, value } = await reader.read();
        if (done) {
            break
        }

        raw += decoder.decode(value, { stream: true })
    }
    const reply = extractReplyText(raw);
    const activity = extractTurnActivity(raw);

    buffer.addToolCalls(activity.toolCalls, activity.reply);
    console.log("=== ACCUMULATED SSE ===");
    console.log(reply);

    console.log("=== NARRATION ===");
    console.log(activity);

    
    for (const t of activity.toolCalls) {
        console.log("TOOL:", t.name, t.input?.file_path ?? t.input?.command ?? "");
    }
    if (!prompt || !reply) return;

    try {
        const res = await fetch(`http://${config.memory.host}:${config.memory.port}/memory`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ prompt, response: activity.reply, source_agent: "claude_code"})
        })

        if (!res.ok) throw new Error(`store failed: ${res.status}`);
        console.log("memory logged :)");
    } catch (e) {
        console.log("store failed", e)
    }
}