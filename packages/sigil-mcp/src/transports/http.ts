import { createServer } from "node:http";
import type { SigilMcpServer } from "../server.js";
import type { JsonRpcRequest } from "../types.js";

export interface HttpTransportOptions {
    host: string;
    port: number;
}

export function startHttpTransport(server: SigilMcpServer, opts: HttpTransportOptions): void {
    const httpServer = createServer(async (req, res) => {
        if (!req.url) {
            res.writeHead(400).end();
            return;
        }

        if (req.method === "GET" && req.url === "/health") {
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
            return;
        }

        if (req.method !== "POST" || req.url !== "/mcp") {
            res.writeHead(404).end();
            return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        req.on("end", async () => {
            let request: JsonRpcRequest;
            try {
                request = JSON.parse(Buffer.concat(chunks).toString("utf8")) as JsonRpcRequest;
            } catch {
                res.writeHead(400, { "content-type": "application/json" });
                res.end(JSON.stringify(server.error(null, -32700, "Invalid JSON payload")));
                return;
            }

            const response = await server.handleRequest(request);
            if (!response) {
                res.writeHead(204).end();
                return;
            }

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify(response));
        });
    });

    httpServer.listen(opts.port, opts.host, () => {
        // eslint-disable-next-line no-console
        console.error(`[sigil-mcp] HTTP transport listening on http://${opts.host}:${opts.port}/mcp`);
    });
}
