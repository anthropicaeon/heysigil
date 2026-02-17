/**
 * Ethereum Address Utilities
 *
 * Centralized validation and normalization for wallet addresses.
 */

import { isAddress, getAddress } from "ethers";

/**
 * Ethereum address type (checksummed hex string).
 */
export type Address = `0x${string}`;

/**
 * Normalize an address to checksummed format.
 * @throws if address is invalid
 */
export function normalizeAddress(addr: string): Address {
    if (!isAddress(addr)) {
        throw new Error(`Invalid Ethereum address: ${addr}`);
    }
    return getAddress(addr) as Address;
}

/**
 * Check if two addresses are equal (case-insensitive).
 */
export function addressesMatch(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase();
}

/**
 * Type guard for valid Ethereum addresses.
 */
export function isValidAddress(addr: unknown): addr is Address {
    return typeof addr === "string" && isAddress(addr);
}

/**
 * Lowercase an address for database storage or comparison.
 * @throws if address is invalid
 */
export function toLowerAddress(addr: string): Address {
    if (!isAddress(addr)) {
        throw new Error(`Invalid Ethereum address: ${addr}`);
    }
    return addr.toLowerCase() as Address;
}
