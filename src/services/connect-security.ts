import dns from "node:dns/promises";
import net from "node:net";
import { getEnv } from "../config/env.js";

const BLOCKED_HOSTNAMES = new Set([
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
]);

const BLOCKED_IPS = new Set([
    "127.0.0.1",
    "::1",
    "169.254.169.254", // AWS/GCP/Azure metadata
    "100.100.100.200", // Alibaba metadata
    "169.254.170.2", // ECS metadata
]);

function isPrivateIpv4(ip: string): boolean {
    const parts = ip.split(".").map((part) => Number(part));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
        return true;
    }

    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast/reserved
    return false;
}

function isPrivateIpv6(ip: string): boolean {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local
    if (normalized.startsWith("fe80:")) return true; // link-local
    return false;
}

function isBlockedIp(ip: string): boolean {
    if (BLOCKED_IPS.has(ip)) return true;
    const version = net.isIP(ip);
    if (version === 4) return isPrivateIpv4(ip);
    if (version === 6) return isPrivateIpv6(ip);
    return true;
}

export async function validateConnectEndpoint(endpoint: string): Promise<string> {
    const url = new URL(endpoint);
    const env = getEnv();

    if (env.NODE_ENV === "production" && url.protocol !== "https:") {
        throw new Error("Endpoint must use HTTPS in production");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("Endpoint must be HTTP or HTTPS");
    }
    if (url.username || url.password) {
        throw new Error("Endpoint auth info is not allowed");
    }

    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
        throw new Error("Endpoint hostname is not allowed");
    }

    const directIpVersion = net.isIP(hostname);
    if (directIpVersion !== 0 && isBlockedIp(hostname)) {
        throw new Error("Endpoint IP range is not allowed");
    }

    if (directIpVersion === 0) {
        const records = await dns.lookup(hostname, { all: true, verbatim: true });
        if (records.length === 0) {
            throw new Error("Endpoint DNS lookup returned no records");
        }
        if (records.some((record) => isBlockedIp(record.address))) {
            throw new Error("Endpoint resolves to a private or blocked IP range");
        }
    }

    const normalizedPath = url.pathname.replace(/\/$/, "");
    const normalized = `${url.protocol}//${url.host}${normalizedPath}`;
    return normalized;
}
