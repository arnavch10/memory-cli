import type { Configuration } from "../commands/run";

export async function accumulateStream(stream: ReadableStream, prompt: string, config: Configuration) {
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

    console.log("=== ACCUMULATED RAW SSE ===");
    console.log(raw.slice(0, 1500));
}