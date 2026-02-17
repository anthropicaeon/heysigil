/**
 * Format Utilities
 *
 * Centralized number, token, time, and address formatting.
 */

/**
 * Format large numbers with K/M/B suffixes.
 */
export function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
}

/**
 * Format string number (with commas) to abbreviated form.
 */
export function formatNumericString(val: string): string {
    const num = parseFloat(val.replace(/,/g, ""));
    if (isNaN(num)) return val;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(0)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
    return val;
}

/**
 * Format token amount string to abbreviated form.
 */
export function formatTokens(val: string): string {
    const num = parseFloat(val.replace(/,/g, ""));
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    return val;
}

/**
 * Format bigint token amount with decimals.
 */
export function formatTokenAmount(amount: bigint, decimals = 18): string {
    const value = Number(amount) / Math.pow(10, decimals);
    return formatNumber(value);
}

/**
 * Format time remaining from milliseconds.
 */
export function formatTimeRemaining(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

/**
 * Truncate Ethereum address for display.
 */
export function truncateAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Parse a comma-formatted number string to number.
 */
export function parseNumberString(val: string): number {
    return parseFloat(val.replace(/,/g, "")) || 0;
}

/**
 * Format user input with thousand separators (for controlled inputs).
 */
export function formatNumberInput(value: string): string {
    const cleaned = value.replace(/[^0-9]/g, "");
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format currency amount from bigint (defaults to USD with 6 decimals for USDC).
 */
export function formatCurrency(raw: bigint, decimals = 6, symbol = "$"): string {
    const num = Number(raw) / Math.pow(10, decimals);
    if (num === 0) return `${symbol}0.00`;
    if (num < 0.01) return `<${symbol}0.01`;
    return `${symbol}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
