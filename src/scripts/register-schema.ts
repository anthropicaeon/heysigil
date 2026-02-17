/**
 * Register the Sigil EAS schema on-chain.
 *
 * Usage:
 *   DATABASE_URL=... ATTESTATION_SIGNER_KEY=... bun run src/scripts/register-schema.ts
 *
 * Or with explicit args:
 *   bun run src/scripts/register-schema.ts --rpc https://sepolia.base.org --chain sepolia
 *
 * After running, copy the output schema UID into your .env as EAS_SCHEMA_UID=...
 */

import { EAS, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { createLogger } from "../utils/logger.js";

const log = createLogger("register-schema");

// ─── Constants ──────────────────────────────────────────

// EAS Schema Registry addresses (same on all OP Stack chains)
const SCHEMA_REGISTRY_ADDRESS = "0x4200000000000000000000000000000000000020";
const EAS_CONTRACT_ADDRESS = "0x4200000000000000000000000000000000000021";

// The schema for Sigil pool claim verifications
const SCHEMA_STRING =
    "string platform,string projectId,address wallet,uint64 verifiedAt,bool isOwner";

// ─── Config ─────────────────────────────────────────────

function getConfig() {
    const args = process.argv.slice(2);

    let rpcUrl = "https://sepolia.base.org";
    let chainLabel = "Base Sepolia";

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--rpc" && args[i + 1]) {
            rpcUrl = args[i + 1];
            chainLabel = "custom";
            i++;
        }
        if (args[i] === "--chain" && args[i + 1]) {
            chainLabel = args[i + 1];
            if (chainLabel === "mainnet") {
                rpcUrl = "https://mainnet.base.org";
                chainLabel = "Base Mainnet";
            }
            i++;
        }
    }

    const signerKey = process.env.ATTESTATION_SIGNER_KEY;
    if (!signerKey) {
        log.error("ATTESTATION_SIGNER_KEY environment variable is required.");
        log.error("This is the private key of the wallet that will register the schema.");
        log.error("Usage:");
        log.error("  ATTESTATION_SIGNER_KEY=0x... bun run src/scripts/register-schema.ts");
        process.exit(1);
    }

    return { rpcUrl, chainLabel, signerKey };
}

// ─── Main ───────────────────────────────────────────────

async function main() {
    const { rpcUrl, chainLabel, signerKey } = getConfig();

    log.info("Sigil EAS Schema Registration");
    log.info({ chain: chainLabel, rpc: rpcUrl, registry: SCHEMA_REGISTRY_ADDRESS }, "Config");
    log.info({ schema: SCHEMA_STRING }, "Schema");

    // Connect
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(signerKey, provider);
    const signerAddress = await signer.getAddress();

    log.info({ signer: signerAddress }, "Signer");

    const balance = await provider.getBalance(signerAddress);
    log.info({ balanceEth: ethers.formatEther(balance) }, "Signer balance");

    if (balance === 0n) {
        log.error("Signer has zero balance. Fund it with testnet ETH first.");
        log.error(
            "Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
        );
        process.exit(1);
    }

    // Check if schema already registered by trying to look it up
    log.info("Registering schema...");

    const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
    schemaRegistry.connect(signer);

    try {
        const tx = await schemaRegistry.register({
            schema: SCHEMA_STRING,
            resolverAddress: ethers.ZeroAddress, // No resolver
            revocable: true,
        });

        const schemaUid = await tx.wait();

        log.info({ schemaUid }, "Schema registered successfully");
        log.info("Add this to your .env file:");
        log.info(`EAS_SCHEMA_UID=${schemaUid}`);

        // Verify we can read it back
        const eas = new EAS(EAS_CONTRACT_ADDRESS);
        eas.connect(provider);
        log.info("Verified on EAS");
        log.info(`   View on explorer: https://base-sepolia.easscan.org/schema/view/${schemaUid}`);
    } catch (err) {
        if (err instanceof Error && err.message.includes("already")) {
            log.warn("Schema may already be registered.");
            log.warn(`   Check: https://base-sepolia.easscan.org/schemas`);
        } else {
            log.error({ err }, "Registration failed");
            process.exit(1);
        }
    }
}

main().catch((err) => {
    log.error({ err }, "Fatal error");
    process.exit(1);
});
