import { readFile } from "node:fs/promises";
import path from "path";
export async function runCommand() {

    console.log("memory runtime started")

    // read config.json and print out the ports
    try {
        const configPath = path.join(".memory", "config.json");
        const configData = await readFile(configPath, "utf8");
        const config = JSON.parse(configData);

        console.log("running on proxy port", config.proxyPort);
        console.log("running on memory port", config.memoryPort);


        // start http server
        Bun.serve({
            port: config.proxyPort,
            fetch(req) {
                return new Response("memory proxy running");
            },
        });

    } catch (e) {
        console.log(e)
    }
}