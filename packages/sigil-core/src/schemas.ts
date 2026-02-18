import { z } from "zod";
import { SIGIL_SCOPES } from "./scopes.js";

export const sigilScopeSchema = z.enum(SIGIL_SCOPES);

export const mcpTokenMetadataSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    tokenPrefix: z.string(),
    scopes: z.array(sigilScopeSchema),
    expiresAt: z.string().datetime().nullable(),
    lastUsedAt: z.string().datetime().nullable(),
    revokedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
});
