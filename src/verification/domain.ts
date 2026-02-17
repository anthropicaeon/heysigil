import dns from "node:dns/promises";
import { load } from "cheerio";
import type { VerificationResult } from "./types.js";
import { parseConfigFile } from "../utils/config-parser.js";
import { getErrorMessage } from "../utils/errors.js";

/**
 * Verify domain ownership via DNS TXT record.
 *
 * Expected record: _poolclaim.example.com TXT "pool-claim-verify=<walletAddress>:<code>"
 */
export async function verifyDomainDns(
    domain: string,
    expectedCode: string,
    expectedWallet: string,
): Promise<VerificationResult> {
    const projectId = domain;
    const lookupHost = `_poolclaim.${domain}`;

    try {
        const records = await dns.resolveTxt(lookupHost);
        // records is string[][] — each TXT record is an array of strings (chunks)
        const flatRecords = records.map((chunks) => chunks.join(""));

        const expectedValue = `pool-claim-verify=${expectedWallet}:${expectedCode}`;
        const found = flatRecords.some(
            (r) => r.trim().toLowerCase() === expectedValue.toLowerCase(),
        );

        if (!found) {
            return {
                success: false,
                method: "domain_dns",
                projectId,
                error: `DNS TXT record not found. Add this record:\n  ${lookupHost} TXT "${expectedValue}"`,
                proof: { recordsFound: flatRecords },
            };
        }

        return {
            success: true,
            method: "domain_dns",
            projectId,
            proof: { record: expectedValue, host: lookupHost },
        };
    } catch (err) {
        const message = getErrorMessage(err);
        // ENOTFOUND / ENODATA means no records exist
        if (message.includes("ENOTFOUND") || message.includes("ENODATA")) {
            return {
                success: false,
                method: "domain_dns",
                projectId,
                error: `No DNS TXT records found for ${lookupHost}. Add:\n  ${lookupHost} TXT "pool-claim-verify=${expectedWallet}:${expectedCode}"`,
            };
        }
        return {
            success: false,
            method: "domain_dns",
            projectId,
            error: message,
        };
    }
}

/**
 * Verify domain ownership via well-known file.
 *
 * Expected file at: https://example.com/.well-known/pool-claim.txt
 * Content:
 *   verification-token=<code>
 *   wallet-address=<address>
 */
export async function verifyDomainFile(
    domain: string,
    expectedCode: string,
    expectedWallet: string,
): Promise<VerificationResult> {
    const projectId = domain;
    const url = `https://${domain}/.well-known/pool-claim.txt`;

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return {
                success: false,
                method: "domain_file",
                projectId,
                error: `Could not fetch ${url} — HTTP ${response.status}. Place a file at that URL with your verification token.`,
            };
        }

        const content = await response.text();
        const parsed = parseConfigFile(content, ["verification-token", "wallet-address"]);
        const fileToken = parsed["verification-token"];
        const fileWallet = parsed["wallet-address"];

        if (fileToken !== expectedCode) {
            return {
                success: false,
                method: "domain_file",
                projectId,
                error: "Verification token does not match",
            };
        }

        if (fileWallet?.toLowerCase() !== expectedWallet.toLowerCase()) {
            return {
                success: false,
                method: "domain_file",
                projectId,
                error: "Wallet address does not match",
            };
        }

        return {
            success: true,
            method: "domain_file",
            projectId,
            proof: { url, content },
        };
    } catch (err) {
        return {
            success: false,
            method: "domain_file",
            projectId,
            error: getErrorMessage(err),
        };
    }
}

/**
 * Verify domain ownership via HTML meta tag.
 *
 * Expected tag: <meta name="pool-claim-verification" content="<walletAddress>:<code>" />
 */
export async function verifyDomainMeta(
    domain: string,
    expectedCode: string,
    expectedWallet: string,
): Promise<VerificationResult> {
    const projectId = domain;
    const url = `https://${domain}`;

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return {
                success: false,
                method: "domain_meta",
                projectId,
                error: `Could not fetch ${url} — HTTP ${response.status}`,
            };
        }

        const html = await response.text();
        const $ = load(html);
        const metaContent = $('meta[name="pool-claim-verification"]').attr("content");

        if (!metaContent) {
            return {
                success: false,
                method: "domain_meta",
                projectId,
                error: `Meta tag not found. Add to your <head>:\n  <meta name="pool-claim-verification" content="${expectedWallet}:${expectedCode}" />`,
            };
        }

        const expectedContent = `${expectedWallet}:${expectedCode}`;
        if (metaContent.trim().toLowerCase() !== expectedContent.toLowerCase()) {
            return {
                success: false,
                method: "domain_meta",
                projectId,
                error: `Meta tag content mismatch. Expected: "${expectedContent}", got: "${metaContent}"`,
            };
        }

        return {
            success: true,
            method: "domain_meta",
            projectId,
            proof: { url, metaContent },
        };
    } catch (err) {
        return {
            success: false,
            method: "domain_meta",
            projectId,
            error: getErrorMessage(err),
        };
    }
}
