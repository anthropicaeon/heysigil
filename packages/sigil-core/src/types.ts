export interface SigilRequestOptions {
    signal?: AbortSignal;
}

export interface SigilTokenInfo {
    authType: "privy" | "mcp";
    userId: string;
    scopes: string[];
}
