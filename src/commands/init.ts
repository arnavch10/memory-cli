import { promises as fs } from "node:fs";
import path from "path";
import { mkdir, writeFile } from "node:fs/promises";
export async function initCommand(options: boolean) {

    console.log("init ran", options)
    try {
        // creating file
        const data = JSON.stringify({version: "0.1.0"})
        const projectFolder = ".memory";
        const createDir = await mkdir(projectFolder, { recursive: true }); // using true to not throw error if directory already exists
        
        // config path
        const configPath = path.join(projectFolder, "config.json");

        const configFile = await writeFile(configPath, data, "utf8");
        await configFile
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