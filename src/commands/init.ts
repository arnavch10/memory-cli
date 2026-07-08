import path from "path";
import { access, mkdir, writeFile } from "node:fs/promises";
import { createFreePort } from "../lib/ports";

const projectFolder = ".memory";
const configPath = path.join(projectFolder, "config.json");
const ledgerPath = path.join(projectFolder, "ledger.json");

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function initCommand(options?: boolean): Promise<void>{

    console.log("init ran", options)
    try {
        const proxyPort = await createFreePort(); // ts proxy port
        let memoryPort = await createFreePort(); // python memory engine port

        while (memoryPort === proxyPort) {
            memoryPort = await createFreePort();
        }

        // check whether config and ledger already exist
        if (await fileExists(configPath) && await fileExists(ledgerPath)) {
            console.log("Config and ledger already exist!");
        }
        
        // creating file
        const data = JSON.stringify({version: "0.1.0", proxyPort, memoryPort}, null, 2);
        const ledgeData = JSON.stringify({fileName: "", lineChanges: "", codeChanges: ""}, null, 2);

        const createDir = await mkdir(projectFolder, { recursive: true }); // using true to not throw error if directory already exists
        
        await writeFile(configPath, data, "utf8");
        await writeFile(ledgerPath, ledgeData, "utf8");
        // checking if the memory folder already exists
        if (createDir !== undefined) {
            console.log(`${projectFolder} created`)
        } else {
            console.log(`${projectFolder} already exists`)
        } 
    } catch (error) {
        
        console.log("Error creating folder: ", error);
    }
}
