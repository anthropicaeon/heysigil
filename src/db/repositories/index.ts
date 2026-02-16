/**
 * Database Repositories
 *
 * Persistence layer for users, identities, wallets, and fee distributions.
 * All repositories fall back to in-memory storage when DATABASE_URL is not set.
 */

export * from "./wallet.repository.js";
export {
    // User repository
    findUserById,
    findUserByPrivyId,
    findUserByWalletAddress,
    findUsersMergedInto,
    createUser,
    updateUser,
    listPhantomUsers,
    // Identity repository
    findIdentityByPlatform,
    findIdentitiesByUserId,
    createIdentity,
    updateIdentitiesUserId,
    // Types
    type DbUser,
    type DbIdentity,
} from "./identity.repository.js";

export {
    // Fee distribution repository
    createFeeDistribution,
    findByTxHashAndLogIndex,
    findByPoolId,
    findByDevAddress,
    findDistributions,
    findByTxHash,
    getAggregateStats,
    // Indexer state
    getLastProcessedBlock,
    updateLastProcessedBlock,
    linkPoolToProject,
    // Types
    type FeeEventType,
    type DbFeeDistribution,
    type DbIndexerState,
    type FeeDistributionInsert,
    type PaginationParams,
    type PaginatedResult,
    type AggregateStats,
} from "./fee-distribution.repository.js";
