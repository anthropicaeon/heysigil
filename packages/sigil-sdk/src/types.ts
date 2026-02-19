export type TokenProvider = () => Promise<string | null> | string | null;

export type SigilScope =
    | "verify:read"
    | "verify:write"
    | "dashboard:read"
    | "chat:write"
    | "governance:read"
    | "governance:write"
    | "developers:read"
    | "launch:read"
    | "launch:write"
    | "wallet:read"
    | "fees:read"
    | "claim:write"
    | "tokens:manage";

export interface SigilClientConfig {
    baseUrl: string;
    token?: string;
    tokenProvider?: TokenProvider;
    fetch?: typeof globalThis.fetch;
    timeoutMs?: number;
}

export interface VerifyChallengeRequest {
    method: string;
    projectId: string;
    walletAddress: string;
}

export interface VerifyChallengeResponse {
    verificationId: string;
    challengeCode: string;
    method: string;
    projectId: string;
    walletAddress: string;
    instructions: string[];
    authUrl?: string;
    expiresAt?: string;
}

export interface VerifyCheckRequest {
    verificationId: string;
    tweetProof?: unknown;
}

export interface VerifyCheckResponse {
    verificationId: string;
    status: "pending" | "verified" | "failed" | "expired";
    success: boolean;
    error?: string;
    method: string;
    projectId: string;
}

export interface LaunchListQuery {
    limit?: number;
    offset?: number;
    q?: string;
    platform?: "github" | "twitter" | "facebook" | "instagram" | "domain";
    sort?: "newest" | "oldest";
}

export interface LaunchListItem {
    projectId: string;
    name?: string | null;
    description?: string | null;
    platform: string;
    poolTokenAddress: string;
    poolId: string;
    deployTxHash?: string | null;
    deployedBy?: string | null;
    attestationUid?: string | null;
    ownerWallet?: string | null;
    createdAt?: string | null;
    verifiedAt?: string | null;
    explorerUrl: string;
    dexUrl: string;
}

export interface LaunchListResponse {
    launches: LaunchListItem[];
    pagination: {
        limit: number;
        offset: number;
        count: number;
        hasMore: boolean;
    };
}

export interface LaunchCreateRequest {
    devLinks: string[];
    name?: string;
    symbol?: string;
    description?: string;
    sessionId?: string;
    isSelfLaunch?: boolean;
}

export interface WalletResponse {
    exists: boolean;
    address: string | null;
    balance?: {
        eth: string;
        tokens: Array<{ symbol: string; balance: string; address: string }>;
    } | null;
    createdAt?: string;
}

export interface MyProjectsResponse {
    projects: Array<Record<string, unknown>>;
    claimableProjects: Array<Record<string, unknown>>;
}

export interface ChatMessageRequest {
    message: string;
    sessionId?: string | null;
    walletAddress?: string;
    agentId?: string;
}

export interface ChatMessageResponse {
    sessionId: string;
    response: unknown;
}

export interface ChatSessionQuery {
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
}

export interface ChatHistoryMessage {
    id: string;
    role: "user" | "assistant";
    source: "user" | "assistant" | "agent";
    content: string;
    timestamp: string;
    deleted: boolean;
    deletedAt: string | null;
    upvotes: number;
    downvotes: number;
    myVote: "up" | "down" | "none";
}

export interface ChatSessionResponse {
    sessionId: string;
    platform: string;
    hasWallet: boolean;
    messages: ChatHistoryMessage[];
    pagination?: {
        limit: number;
        offset: number;
        count: number;
        total: number;
        hasMore: boolean;
    };
}

export interface ChatVoteRequest {
    sessionId: string;
    messageId: string;
    vote: "up" | "down";
}

export interface ChatVoteResponse {
    success: boolean;
    messageId: string;
    vote: "up" | "down";
    upvotes: number;
    downvotes: number;
}

export interface ChatDeleteRequest {
    sessionId: string;
    messageId: string;
    reason?: string;
}

export interface ChatDeleteResponse {
    success: boolean;
    messageId: string;
    deletedAt: string;
}

export interface ChatAgentFeedItem {
    id: string;
    sessionId: string;
    role: "user" | "assistant";
    source: "agent";
    content: string;
    timestamp: string;
}

export interface ChatAgentFeedResponse {
    messages: ChatAgentFeedItem[];
    limit: number;
    count: number;
}

export interface FeesTotalsResponse {
    totalDistributedWei: string;
    totalDevClaimedWei: string;
    totalProtocolClaimedWei: string;
    totalEscrowedWei: string;
    distributionCount: number;
    uniqueDevs: number;
    uniquePools: number;
    lastIndexedBlock: number | null;
    lastIndexedAt: string | null;
}

export interface CreateMcpTokenRequest {
    name?: string;
    scopes?: SigilScope[];
    expiresInDays?: number;
}

export interface McpTokenMetadata {
    id: string;
    name: string;
    tokenPrefix: string;
    scopes: SigilScope[];
    expiresAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
}

export interface CreateMcpTokenResponse {
    token: string;
    tokenInfo: McpTokenMetadata;
}

export interface TokenInfoResponse {
    authType: "privy" | "mcp";
    userId: string;
    scopes: SigilScope[];
}

export interface DashboardOverview {
    wallet: WalletResponse;
    projects: MyProjectsResponse;
    feesTotals: FeesTotalsResponse;
}
