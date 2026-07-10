import { readFile } from "node:fs/promises";
import { accumulateStream } from "../lib/accumulate";
import { URL } from "node:url";
import path from "path";
import { isRealUserTurn } from "../lib/turn";
import { extractUserPrompt, spliceContext } from "../lib/extract";

// global config type
export interface Configuration {
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

interface Context {
    context: string;
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
            fetch(req, server) {

                server.timeout(req, 0);
                return proxyFetch(req, config)
            },
        });


    } catch (e) {
        console.log(e)
    }
}


export async function proxyFetch(req: Request, config: Configuration): Promise<Response> {
    const url = new URL(req.url);
    const raw = await req.text();

    let bodyToSend = raw;
    let parsed: any = null;
    try {
        parsed = JSON.parse(raw);
    } catch {
        parsed = null;
    }
    
    
    
    console.log("request body:",raw.slice(0, 2000));

    const realUserTurn = parsed !== null && isRealUserTurn(parsed);
    let prompt = "";
    const target: string = config.upstream.anthropic + url.pathname + url.search;
    
    if (realUserTurn) {
        prompt = extractUserPrompt(parsed)
        // TODO: call your Python memory service /context with { input: prompt }
        //       (await fetch to `http://${config.memoryService.host}:${config.memoryService.port}/context`,
        //        POST, JSON body, read back the { context } field)
        //       Wrap this in try/catch — if Python is down, injection should FAIL SOFT:
        //       log it and forward raw, never crash the user's request.
        let context = "";
        try {

            if (!prompt) {
                // don't do anything
            } else {
                const res = await fetch(`http://${config.memory.host}:${config.memory.port}/context`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ input: prompt })
                })

                if (!res.ok) {
                throw new Error(`Response Status: ${res.status}`);
            } 

                const result = await res.json() as Context;
                context = result.context; 
                console.log(result);
            }
            


            

        } catch (e) {
            console.log(e)
        }
        // TODO: if context is a non-empty string:
        //         const modified = spliceContext(parsed, context)
        //         bodyToSend = JSON.stringify(modified)
        //       else: leave bodyToSend = raw

        if (context) {
            const modified = spliceContext(parsed, context)
            bodyToSend = JSON.stringify(modified);
        } else {
            bodyToSend = raw;
        }

        console.log("real turn ^")
    }


    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("content-length");
    headers.delete("accept-encoding");

    console.log(`→ ${req.method} ${url.pathname}`);
    try {
        const upstream = await fetch(target, {
            method: req.method,
            headers,
            body: bodyToSend,
        } as RequestInit);

        const resHeaders = new Headers(upstream.headers);
        resHeaders.delete("content-encoding");
        resHeaders.delete("content-length");


        
        const [toClient, toAcculumator] = (upstream.body as ReadableStream<Uint8Array>).tee(); // value is not null
        
        accumulateStream(toAcculumator, prompt, config).catch((e) => {
            console.log("error: ", e);
        })

        return new Response(toClient, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: resHeaders,
        });
    } catch(e) { 
        console.log(e)

        return new Response("proxy error", { status: 502 });
    }
   
}