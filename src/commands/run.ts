import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import path from "path";


// global config type
interface Configuration {
    proxy: {
        host: string;
        port: number;
    },
    memory: {
        host: string;
        port: number;
    },
    upstream: {
        anthropic: string;
        openai: string;
    }
}

export async function runCommand() {

    console.log("memory runtime started")

    // read config.json and print out the ports
    try {
        const configPath = path.join(".memory", "config.json");
        const configData = await readFile(configPath, "utf8");
        const config: Configuration = JSON.parse(configData);


        console.log("running on proxy port", config.proxy.port);


        console.log("running on memory port", config.memory.port);
        // start http server
        Bun.serve({
            hostname: config.proxy.host,
            port: config.proxy.port,
            fetch(req) {
                return proxyFetch(req, config)
            },
        });


    } catch (e) {
        console.log(e)
    }
}


async function proxyFetch(req: Request, config: Configuration): Promise<Response> {
    const url = new URL(req.url);

    const target: string = config.upstream.anthropic + url.pathname + url.search;
    
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("content-length");

    console.log(`→ ${req.method} ${url.pathname}`);

    return fetch(target, {
        method: req.method,
        headers: headers,
        body: req.body,
        duplex: "half",
    }); 
}