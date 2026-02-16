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
        console.error("Error: ATTESTATION_SIGNER_KEY environment variable is required.");
        console.error("This is the private key of the wallet that will register the schema.");
        console.error("");
        console.error("Usage:");
        console.error(
            "  ATTESTATION_SIGNER_KEY=0x... bun run src/scripts/register-schema.ts",
        );
        process.exit(1);
    }

    return { rpcUrl, chainLabel, signerKey };
}

// ─── Main ───────────────────────────────────────────────

async function main() {
    const { rpcUrl, chainLabel, signerKey } = getConfig();

    console.log(`\n🔷 Sigil EAS Schema Registration`);
    console.log(`   Chain:    ${chainLabel}`);
    console.log(`   RPC:      ${rpcUrl}`);
    console.log(`   Registry: ${SCHEMA_REGISTRY_ADDRESS}`);
    console.log(`   Schema:   "${SCHEMA_STRING}"`);
    console.log();

    // Connect
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(signerKey, provider);
    const signerAddress = await signer.getAddress();

    console.log(`   Signer:   ${signerAddress}`);

    const balance = await provider.getBalance(signerAddress);
    console.log(`   Balance:  ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        console.error("\n❌ Signer has zero balance. Fund it with testnet ETH first.");
        console.error("   Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
        process.exit(1);
    }

    // Check if schema already registered by trying to look it up
    console.log(`\n⏳ Registering schema...`);

    const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
    schemaRegistry.connect(signer);

    try {
        const tx = await schemaRegistry.register({
            schema: SCHEMA_STRING,
            resolverAddress: ethers.ZeroAddress, // No resolver
            revocable: true,
        });

        const schemaUid = await tx.wait();

        console.log(`\n✅ Schema registered successfully!`);
        console.log(`\n   Schema UID: ${schemaUid}`);
        console.log();
        console.log(`   Add this to your .env file:`);
        console.log(`   EAS_SCHEMA_UID=${schemaUid}`);
        console.log();

        // Verify we can read it back
        const eas = new EAS(EAS_CONTRACT_ADDRESS);
        eas.connect(provider);
        console.log(`   Verified on EAS ✓`);
        console.log(
            `   View on explorer: https://base-sepolia.easscan.org/schema/view/${schemaUid}`,
        );
    } catch (err) {
        if (
            err instanceof Error &&
            err.message.includes("already")
        ) {
            console.log(`\n⚠️  Schema may already be registered.`);
            console.log(
                `   Check: https://base-sepolia.easscan.org/schemas`,
            );
        } else {
            console.error(`\n❌ Registration failed:`, err);
            process.exit(1);
        }
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
