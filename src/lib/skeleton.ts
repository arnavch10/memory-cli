//ctags --output-format=json -f - {filepath}
import type { Action } from "../lib/anthropic/buffer";
import { which } from "bun";
import * as fs from "fs";
import { supportedTools } from "../lib/anthropic/format"

async function checkFileExists(filepath: Action): Promise<boolean> {
    try {
        await fs.promises.access(filepath.input.file_path, fs.constants.F_OK);
        return true;
    } catch (e) {
        return false;
    }
}

async function getActionFilePath(action: Action) {
    return await checkFileExists(action) ? action.input.file_path : undefined;
}

async function getCtagSymbols(filepath: Action) {

    if (!checkFileExists(filepath)) {
        return [];
    }

    // check if ctags is installed
    const isCtagsInstalled = which("ctags") !== null;

    if (isCtagsInstalled) {
        // starting ctags process
        const process = Bun.spawn(["ctags", "--output-format=json", "-f", "-", filepath.input.file_path]);

        const output = await new Response(process.stdout).text();
        const lines = output.split(/\r?\n/).filter(line => line.trim() !== ""); // split into new lines and filter out any blank space
        
        const record = lines.map(line => JSON.parse(line));
        const tags = record.map(({ name, kind, line }) => ({
            name,
            kind,
            line,
        }));

        await process.exited;
        console.log(output)
        return tags;
    } else {
        return [];
    }

}

async function createActionsSkeleton(actions: Action[]) {
    if (actions.length) {
        for (const a of actions) {
           if (!supportedTools.includes(a.tool)) {
            continue;
           }

           if (a.isError) {
            continue;
           }

           const path = await getActionFilePath(a);
           
           if (!path) {
            continue;
           } else {
            try {
                const symbols = getCtagSymbols(path)
                console.log(symbols)
            } catch (e) {
            console.log(e);
           }

           }

        }
    }
}