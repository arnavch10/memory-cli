import type { Action } from "./buffer"; // adjust path

// Pull the ONE meaningful field out of a tool's input.
// Different tools carry different fields:
//   Write / Edit / Read / Update -> input.file_path
//   Bash                 -> input.command
//   others               -> fall back to something readable


const supportedTools = [
  "Bash",
  "Write",
  "Edit",
  "Update"
]


function describeInput(action: Action): string {
    const i = action.input ?? {};
    if (i.file_path) return i.file_path;
    if (i.command)   return i.command;
    return JSON.stringify(i).slice(0, 120);  // last-resort readable form
}

export function formatActions(prompt: string, narration: string, actions: Action[]): string {
    // Build a human-readable block. Example target output:
    //
    //   User request: build an F1 app
    //   Agent narration: I'll scaffold the frontend and backend.
    //   Actions taken:
    //   - Write frontend/src/Dashboard.jsx → success
    //   - Bash "npm test" → FAILED: 3 tests failed (auth.test.ts)
    //
      const lines: string[] = [];
      lines.push(`User request: ${prompt}`);
      if (narration) lines.push(`Agent narration: ${narration}`);
      if (actions.length) {
        lines.push("Actions taken:");
        for (const a of actions) {
          const what = describeInput(a);

          // outcome of tool call
          const outcome = a.isError
            ? `FAILED: ${(a.result ?? "").slice(0, 200)}`
            : `success${a.result ? ": " + a.result.slice(0, 200) : ""}`;
          // only push tools that matter to qwen: bash, edit, write, update?
          if (supportedTools.includes(a.tool)) {
            lines.push(`- ${a.tool} ${what} → ${outcome}`);
          } else {
            continue 
          }
          if (a.tool === "Write") {
            // remove content from write
            const content: any = a.input?.content
            const allLines = content.split("\n")
            const firstLines = allLines.slice(0, 150);
            const removedCount = allLines.length - firstLines.length
            let write = firstLines.join("\n")
            if (removedCount > 0) {
              write = write + `\n[truncated: ${removedCount} more lines]`;
            }
            lines.push(`- ${a.tool} ${what} write -> ${write}`)

          } else if(a.tool === "Edit") {
            const before = a.input?.old_string;
            const after = a.input?.new_string;
            lines.push(`- ${a.tool} ${what} edit -> before: ${before} after: ${after}`)


            // might not need update
          } else if(a.tool === "Update") {
            const update: any = a.input?.update;
            lines.push(`- ${a.tool} ${what} update -> ${update}`)

          } else if (a.tool === "Bash") {
            const result: any = a.input?.commands;
            lines.push(`- ${a.tool} ${what} update -> ${result}`)
          }

        }
      }
      const formatted = lines.join("\n");

      console.log("=== SENDING TO QWEN ===");
      console.log(formatted);
      console.log("=== END QWEN INPUT ===");
      return formatted;
}

