import readline from "node:readline";
import type { SigilMcpServer } from "../server.js";
import type { JsonRpcRequest } from "../types.js";

export function startStdioTransport(server: SigilMcpServer): void {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });

    rl.on("line", async (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        let request: JsonRpcRequest;
        try {
            request = JSON.parse(trimmed) as JsonRpcRequest;
        } catch {
            process.stdout.write(
                `${JSON.stringify(server.error(null, -32700, "Invalid JSON payload"))}\n`,
            );
            return;
        }

        const response = await server.handleRequest(request);
        if (response) {
            process.stdout.write(`${JSON.stringify(response)}\n`);
        }
    });
}
