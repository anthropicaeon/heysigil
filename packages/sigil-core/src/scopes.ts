export const SIGIL_SCOPES = [
    "verify:read",
    "verify:write",
    "dashboard:read",
    "chat:write",
    "governance:read",
    "governance:write",
    "developers:read",
    "launch:read",
    "launch:write",
    "wallet:read",
    "fees:read",
    "claim:write",
    "tokens:manage",
] as const;

export type SigilScope = (typeof SIGIL_SCOPES)[number];
