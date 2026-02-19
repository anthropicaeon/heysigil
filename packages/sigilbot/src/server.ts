import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Logger } from "./logger.js";
import type { SigilBotConfig } from "./types.js";
import { SigilBotRuntime } from "./runtime.js";

interface SigilBotServerDeps {
    config: SigilBotConfig;
    runtime: SigilBotRuntime;
    logger: Logger;
}

interface RunningServer {
    close: () => Promise<void>;
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length === 0) return {};

    const raw = Buffer.concat(chunks).toString("utf8");
    return JSON.parse(raw) as unknown;
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
    res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(payload));
}

export function startSigilBotServer({ config, runtime, logger }: SigilBotServerDeps): RunningServer {
    const server = createServer(async (req, res) => {
        const method = req.method ?? "GET";
        const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

        try {
            if (method === "GET" && url.pathname === "/health") {
                sendJson(res, 200, runtime.health());
                return;
            }

            if (method === "GET" && url.pathname === "/v1/capabilities") {
                sendJson(res, 200, await runtime.capabilities());
                return;
            }

            if (method === "GET" && url.pathname === "/v1/bots") {
                sendJson(res, 200, { bots: runtime.listBots() });
                return;
            }

            if (method === "POST" && url.pathname === "/v1/handshake") {
                const body = await parseJsonBody(req);
                const secretHeader = req.headers["x-sigil-connect-secret"];
                const result = await runtime.handshake(
                    body as never,
                    typeof secretHeader === "string" ? secretHeader : null,
                );
                sendJson(res, 200, result);
                return;
            }

            if (method === "POST" && url.pathname === "/v1/chat") {
                const body = await parseJsonBody(req);
                const result = await runtime.chat(body as never);
                sendJson(res, 200, result);
                return;
            }

            sendJson(res, 404, { error: "Not Found" });
        } catch (error) {
            const mapped = runtime.toHttpError(error);
            logger.error("request failed", {
                method,
                path: url.pathname,
                status: mapped.status,
                error: mapped.message,
            });
            sendJson(res, mapped.status, { error: mapped.message });
        }
    });

    server.listen(config.port, config.host, () => {
        logger.info("sigilbot server listening", {
            host: config.host,
            port: config.port,
            botId: config.botId,
            stack: config.botStack,
        });
    });

    return {
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) reject(error);
                    else resolve();
                });
            }),
    };
}
