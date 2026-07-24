//ctags --output-format=json -f - {filepath}
import type { Action } from "../lib/anthropic/buffer";
import { which } from "bun";
import * as fs from "fs";

async function checkFileExists(filepath: Action): Promise<boolean> {
    try {
        await fs.promises.access(filepath.input.file_path, fs.constants.F_OK);
        return true;
    } catch (e) {
        return false;
    }
}

async function getCtagSymbols(filepath: Action) {

    if (!checkFileExists) {
        return [];
    }

    // check if ctags is installed
    const isCtagsInstalled = which("ctags") !== null;

    if (isCtagsInstalled) {
        // starting ctags process
        const process = Bun.spawn(["ctags", "--output-format=json", "-f", "-", filepath.input.file_path]);

        const output = await new Response(process.stdout).text();
        const lines = output.split("/\r?\n/").filter(line => line.trim() !== ""); // split into new lines and filter out any blank space
        
        const record = lines.map(line => JSON.parse(line));
        const tags = record.map(({ name, kind, line }) => ({
            name,
            kind,
            line,
        }));

        await process.exited;
        console.log(output)   
    } else {
        return [];
    }

}