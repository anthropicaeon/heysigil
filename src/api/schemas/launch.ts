/**
 * Launch API Schemas
 *
 * Zod schemas for token deployment endpoints.
 */

import { z } from "@hono/zod-openapi";
import {
    SessionIdSchema,
    UUIDSchema,
    WalletAddressSchema,
    TxHashSchema,
    PoolIdSchema,
    TokenAddressSchema,
    PlatformSchema,
    PaginationQuerySchema,
    PaginationResponseSchema,
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
 * POST /api/launch/quick request body
 */
export const QuickLaunchRequestSchema = z
    .object({
        repoUrl: z
            .string()
            .url()
            .max(300)
            .optional()
            .openapi({
                example: "https://github.com/owner/repo",
                description: "Optional GitHub repo URL for quick-launch metadata (defaults to Sigil repo)",
            }),
        name: z
            .string()
            .max(64, "Token name too long (max 64 characters)")
            .optional()
            .openapi({
                example: "My Agent Token",
                description: "Optional token name override",
            }),
        symbol: z
            .string()
            .max(10, "Token symbol too long (max 10 characters)")
            .optional()
            .openapi({
                example: "MAT",
                description: "Optional token symbol override",
            }),
        description: z
            .string()
            .max(500, "Description too long (max 500 characters)")
            .optional()
            .openapi({
                example: "Quick launch for my agent runtime",
                description: "Optional project description override",
            }),
    })
    .openapi("QuickLaunchRequest");

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
            id: UUIDSchema,
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
            id: UUIDSchema,
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
        id: UUIDSchema,
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

/**
 * GET /api/launch/list query parameters
 */
export const LaunchListQuerySchema = PaginationQuerySchema.extend({
    q: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .optional()
        .openapi({ example: "github:org/repo", description: "Search by project name/id/token" }),
    platform: PlatformSchema.optional().openapi({
        description: "Filter by platform",
    }),
    sort: z.enum(["newest", "oldest"]).default("newest").openapi({
        example: "newest",
        description: "Sort direction by creation time",
    }),
});

const LaunchListPlatformSchema = z
    .enum(["github", "twitter", "facebook", "instagram", "domain", "unknown"])
    .openapi({
        example: "github",
        description: "Detected primary project platform",
    });

/**
 * Single launched token list item
 */
export const LaunchListItemSchema = z
    .object({
        projectId: z.string().openapi({ example: "github:org/repo" }),
        name: z.string().nullable().openapi({ example: "Sigil: repo" }),
        description: z.string().nullable().openapi({ example: "A token for my project" }),
        platform: LaunchListPlatformSchema,
        poolTokenAddress: TokenAddressSchema,
        poolId: PoolIdSchema,
        deployTxHash: TxHashSchema.nullable(),
        deployedBy: z.string().nullable().openapi({ example: "api" }),
        attestationUid: z
            .string()
            .nullable()
            .openapi({ example: "0xabc...", description: "EAS UID" }),
        ownerWallet: WalletAddressSchema.nullable(),
        createdAt: TimestampSchema.nullable(),
        verifiedAt: TimestampSchema.nullable(),
        explorerUrl: z.string().url().openapi({ example: "https://basescan.org/address/0x..." }),
        dexUrl: z.string().url().openapi({ example: "https://dexscreener.com/base/0x..." }),
    })
    .openapi("LaunchListItem");

/**
 * GET /api/launch/list response
 */
export const LaunchListResponseSchema = z
    .object({
        launches: z.array(LaunchListItemSchema),
        pagination: PaginationResponseSchema,
    })
    .openapi("LaunchListResponse");

/**
 * POST /api/launch conflict response (already launched)
 */
export const LaunchAlreadyLaunchedResponseSchema = z
    .object({
        success: z.literal(false),
        deployed: z.literal(true),
        error: z.string().openapi({ example: "Token already launched for this project" }),
        project: z.object({
            id: z.string().openapi({ example: "5ce274f1-d2c9-4a28-9f16-0b0d13b6dcf0" }),
            projectId: z.string().openapi({ example: "github:org/repo" }),
            name: z.string().openapi({ example: "Sigil: repo" }),
        }),
        token: z.object({
            address: TokenAddressSchema,
            poolId: PoolIdSchema,
            txHash: TxHashSchema.nullable(),
            explorerUrl: z
                .string()
                .url()
                .openapi({ example: "https://basescan.org/address/0x..." }),
            dexUrl: z.string().url().openapi({ example: "https://dexscreener.com/base/0x..." }),
        }),
    })
    .openapi("LaunchAlreadyLaunchedResponse");

/**
 * POST /api/launch/quick success response
 */
export const QuickLaunchResponseSchema = z
    .object({
        success: z.literal(true),
        deployed: z.boolean().openapi({
            description: "Whether on-chain deployment succeeded (false when deployer is not configured)",
        }),
        project: z.object({
            id: UUIDSchema,
            projectId: z.string().openapi({ example: "quick:550e8400-e29b-41d4-a716-446655440000" }),
            name: z.string(),
            symbol: z.string().optional(),
        }),
        token: TokenDeploymentSchema.optional(),
        claimToken: z.string().openapi({
            example: "sigil_claim_ab12cd34_very_secret_value",
            description: "One-time quick-launch claim token (shown once)",
        }),
        claimTokenExpiresAt: TimestampSchema,
        launchDefaults: z.object({
            repo: z.string().openapi({ example: "github:heysigil/heysigil" }),
            repoUrl: z.string().url().openapi({ example: "https://github.com/heysigil/heysigil" }),
            claimLaterSupported: z.literal(true),
        }),
        runtime: z.object({
            provider: z.literal("railway"),
            stack: z.literal("sigilbot"),
            provisioned: z.boolean().openapi({
                description: "Whether one-click agent runtime provisioning succeeded",
            }),
            endpoint: z.string().url().optional(),
            deployment: z
                .object({
                    projectId: z.string(),
                    serviceId: z.string(),
                    deploymentId: z.string(),
                    minimumResources: z.object({
                        cpuMillicores: z.number(),
                        memoryMb: z.number(),
                    }),
                })
                .optional(),
            error: z.string().optional().openapi({
                description:
                    "Provisioning error details when runtime could not be deployed in one-click flow",
            }),
        }),
    })
    .openapi("QuickLaunchResponse");
