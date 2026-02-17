/**
 * Tool Parameter Mapper
 *
 * Maps raw tool input from Claude to handler-compatible parameters.
 * Handles defaults and parameter transformations.
 */

/**
 * Map tool input to handler params with defaults applied.
 */
export function mapToolParams(
    toolName: string,
    input: Record<string, unknown>,
): Record<string, unknown> {
    switch (toolName) {
        case "swap_tokens":
            return {
                fromToken: input.fromToken,
                toToken: input.toToken,
                amount: input.amount,
                chain: input.chain || "base",
            };
        case "check_balance":
            return { chain: input.chain, token: input.token };
        case "get_price":
            return { token: input.token };
        case "verify_project":
            return { link: input.link };
        case "launch_token":
            return {
                name: input.name,
                symbol: input.symbol,
                description: input.description,
                devLinks: input.devLinks,
                isSelfLaunch: input.isSelfLaunch,
                confirmed: input.confirmed,
            };
        case "send_tokens":
            return {
                token: input.token,
                amount: input.amount,
                toAddress: input.toAddress,
                chain: input.chain || "base",
            };
        case "claim_reward":
            return { projectId: input.projectId };
        case "pool_status":
            return { projectId: input.projectId, link: input.projectId };
        case "create_wallet":
            return {};
        case "export_key":
            return { action: input.action };
        case "get_transaction_history":
            return { limit: input.limit };
        default:
            return input;
    }
}
