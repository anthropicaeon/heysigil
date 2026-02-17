/**
 * Launch API Schemas
 *
 * Zod schemas for token deployment endpoints.
 */

import { z } from "@hono/zod-openapi";
import {
    SessionIdSchema,
    WalletAddressSchema,
    TxHashSchema,
    PoolIdSchema,
    TokenAddressSchema,
    PlatformSchema,
    VerificationMethodSchema,
    TimestampSchema,
    WeiAmountSchema,
} from "./common.js";

// ─── Request Schemas ─────────────────────────────────────

/**
 * POST /api/launch request body
 */
export const LaunchRequestSchema = z
    .object({
        name: z.string().max(64, "Token name too long (max 64 characters)").optional().openapi({
            example: "My Token",
            description: "Token name (auto-generated if omitted, max 64 characters)",
        }),
        symbol: z.string().max(10, "Token symbol too long (max 10 characters)").optional().openapi({
            example: "MTK",
            description: "Token symbol (auto-generated if omitted, max 10 characters)",
        }),
        description: z
            .string()
            .max(500, "Description too long (max 500 characters)")
            .optional()
            .openapi({
                example: "A token for my project",
                description: "Short description (max 500 characters)",
            }),
        devLinks: z
            .array(z.string().url())
            .min(1)
            .max(20, "Too many links (max 20)")
            .openapi({
                example: ["https://github.com/org/repo", "https://x.com/handle"],
                description:
                    "Developer links (GitHub repos, social handles, website URLs). 1-20 valid URLs.",
            }),
        sessionId: SessionIdSchema.optional().openapi({
            description: "Session ID for rate limiting",
        }),
    })
    .openapi("LaunchRequest");

/**
 * Path parameter for project ID (greedy, supports slashes)
 */
export const LaunchProjectIdParamSchema = z.object({
    projectId: z.string().openapi({
        example: "github:org/repo",
        description: "Project identifier",
    }),
});

// ─── Response Schemas ────────────────────────────────────

/**
 * Developer link info
 */
export const DevLinkSchema = z
    .object({
        platform: z.string().openapi({ example: "github" }),
        url: z.string().openapi({ example: "https://github.com/org/repo" }),
        projectId: z.string().openapi({ example: "org/repo" }),
    })
    .openapi("DevLink");

/**
 * Claim instruction for a platform
 */
export const ClaimInstructionSchema = z
    .object({
        platform: z.string().openapi({ example: "github" }),
        projectId: z.string().openapi({ example: "org/repo" }),
        displayUrl: z.string().openapi({ example: "https://github.com/org/repo" }),
        verifyMethods: z.array(z.string()).openapi({
            example: ["github_oauth", "github_file"],
            description: "Available verification methods for this platform",
        }),
    })
    .openapi("ClaimInstruction");

/**
 * Token deployment info
 */
export const TokenDeploymentSchema = z
    .object({
        address: TokenAddressSchema.openapi({
            description: "Deployed token contract address",
        }),
        poolId: PoolIdSchema.openapi({
            description: "Uniswap V4 pool ID",
        }),
        txHash: TxHashSchema.openapi({
            description: "Deployment transaction hash",
        }),
        explorerUrl: z.string().url().openapi({
            example: "https://basescan.org/tx/0x...",
            description: "Block explorer URL",
        }),
        dexUrl: z.string().url().openapi({
            example: "https://app.uniswap.org/...",
            description: "DEX trading URL",
        }),
    })
    .openapi("TokenDeployment");

/**
 * POST /api/launch success response (deployed)
 */
export const LaunchDeployedResponseSchema = z
    .object({
        success: z.literal(true),
        deployed: z.literal(true),
        project: z.object({
            id: z.number().int().openapi({ example: 1 }),
            projectId: z.string().openapi({ example: "github:org/repo" }),
            name: z.string().openapi({ example: "My Token" }),
            symbol: z.string().openapi({ example: "MTK" }),
        }),
        token: TokenDeploymentSchema,
        claimInstructions: z.array(ClaimInstructionSchema).openapi({
            description: "Instructions for developers to claim ownership",
        }),
    })
    .openapi("LaunchDeployedResponse");

/**
 * POST /api/launch success response (registered but not deployed)
 */
export const LaunchRegisteredResponseSchema = z
    .object({
        success: z.literal(true),
        deployed: z.literal(false),
        message: z.string().openapi({
            example: "Project registered but on-chain deployment not configured...",
        }),
        project: z.object({
            id: z.number().int().openapi({ example: 1 }),
            projectId: z.string().openapi({ example: "github:org/repo" }),
            name: z.string().openapi({ example: "My Token" }),
        }),
    })
    .openapi("LaunchRegisteredResponse");

/**
 * POST /api/launch error response with hints
 */
export const LaunchErrorResponseSchema = z
    .object({
        error: z.string().openapi({
            example: "At least one developer link is required",
        }),
        hint: z.string().optional().openapi({
            example: "Provide GitHub repos, Instagram handles, Twitter handles, or website URLs",
        }),
        examples: z
            .array(z.string())
            .optional()
            .openapi({
                example: [
                    "https://github.com/org/repo",
                    "https://instagram.com/handle",
                    "https://x.com/handle",
                ],
            }),
        invalidLinks: z
            .array(z.string())
            .optional()
            .openapi({
                example: ['Could not parse: "invalid"'],
                description: "Links that could not be recognized",
            }),
    })
    .openapi("LaunchErrorResponse");

/**
 * GET /api/launch/deployer response (configured)
 */
export const DeployerConfiguredResponseSchema = z
    .object({
        configured: z.literal(true),
        address: WalletAddressSchema.openapi({
            description: "Deployer wallet address",
        }),
        balanceWei: WeiAmountSchema.openapi({
            description: "ETH balance in wei",
        }),
        balanceFormatted: z.string().openapi({
            example: "0.5 ETH",
            description: "Formatted ETH balance",
        }),
        canDeploy: z.boolean().openapi({
            example: true,
            description: "Whether sufficient gas is available",
        }),
    })
    .openapi("DeployerConfiguredResponse");

/**
 * GET /api/launch/deployer response (not configured)
 */
export const DeployerNotConfiguredResponseSchema = z
    .object({
        configured: z.literal(false),
        message: z.string().openapi({
            example: "Deployer not configured",
        }),
    })
    .openapi("DeployerNotConfiguredResponse");

/**
 * GET /api/launch/:projectId response
 */
export const ProjectDetailsResponseSchema = z
    .object({
        id: z.number().int().openapi({ example: 1 }),
        projectId: z.string().openapi({ example: "github:org/repo" }),
        name: z.string().nullable().openapi({ example: "My Token" }),
        description: z.string().nullable().openapi({ example: "A token for my project" }),
        devLinks: z.array(DevLinkSchema).nullable().openapi({
            description: "Associated developer links",
        }),
        ownerWallet: WalletAddressSchema.nullable().openapi({
            description: "Verified owner wallet address",
        }),
        token: z.object({
            address: TokenAddressSchema.nullable(),
            poolId: PoolIdSchema.nullable(),
            deployTxHash: TxHashSchema.nullable(),
        }),
        attestationUid: z.string().nullable().openapi({
            example: "0xabcdef...",
            description: "EAS attestation UID",
        }),
        deployedBy: z.string().nullable().openapi({
            example: "api",
            description: "How the project was deployed",
        }),
        createdAt: TimestampSchema.nullable(),
        verifiedAt: TimestampSchema.nullable(),
    })
    .openapi("ProjectDetailsResponse");
