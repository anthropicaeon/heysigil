/**
 * Schema Barrel Export
 *
 * Re-exports all API schemas for convenient importing.
 */

// Common schemas used across routes
export * from "./common.js";

// Route-specific schemas
export * from "./chat.js";
export * from "./claim.js";
export * from "./fees.js";
export * from "./launch.js";
export * from "./verify.js";
export * from "./wallet.js";
