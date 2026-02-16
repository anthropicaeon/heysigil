/**
 * Database Repositories
 *
 * Persistence layer for users, identities, and wallets.
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
