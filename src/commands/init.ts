import path from "path";
import { mkdir, writeFile } from "node:fs/promises";
import { createFreePort } from "../lib/ports";
export async function initCommand(options: boolean) {

    console.log("init ran", options)
    try {
        const proxyPort = await createFreePort(); // ts proxy port
        let memoryPort = await createFreePort(); // python memory engine port

        while (memoryPort === proxyPort) {
            memoryPort = await createFreePort();
        }

        
        // creating file
        const data = JSON.stringify({version: "0.1.0", proxyPort, memoryPort})
        const projectFolder = ".memory";
        const createDir = await mkdir(projectFolder, { recursive: true }); // using true to not throw error if directory already exists
        
        // config path
        const configPath = path.join(projectFolder, "config.json");

        await writeFile(configPath, data, "utf8");
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