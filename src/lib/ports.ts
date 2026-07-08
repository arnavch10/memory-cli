import { createServer } from "node:net";


export function createFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.on("error", reject);
        function getPort() {
            const address = server.address();

            if (typeof address === "object" && address !== null) {
                const port = address.port;

                server.close(() => resolve(port));
            } else {
                reject(new Error("could not get port"));
            }
        };
        server.listen(0, "127.0.0.1", getPort);
        server.on("error", reject);
    });
}