/**
 * Register Sigil's EAS schema on Base (or Base Sepolia).
 *
 * Usage:
 *   npx tsx scripts/register-eas-schema.ts
 *
 * Required env vars:
 *   ATTESTATION_SIGNER_KEY — Private key with ETH for gas
 *   EAS_CONTRACT_ADDRESS   — Default: 0x4200000000000000000000000000000000000021 (Base)
 *   RPC_URL                — (optional) RPC URL. Defaults to Base mainnet.
 *
 * After running, copy the output EAS_SCHEMA_UID into your .env file.
 */

import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";

// ─── Config ─────────────────────────────────────────

// The official schema registry on Base (same address as mainnet EAS deployment)
const SCHEMA_REGISTRY_ADDRESS = "0x4200000000000000000000000000000000000020";

// The schema string Sigil uses for pool claim verifications
const SCHEMA_STRING =
    "string platform,string projectId,address wallet,uint64 verifiedAt,bool isOwner";

// Whether the schema is revocable (attestations can be revoked)
const REVOCABLE = true;

async function main() {
    // ─── Validate env ───────────────────────────────────
    const signerKey = process.env.ATTESTATION_SIGNER_KEY;
    if (!signerKey) {
        console.error("❌ ATTESTATION_SIGNER_KEY not set in environment.");
        console.error("   Set it to a private key with ETH for gas on the target chain.");
        process.exit(1);
    }

    const rpcUrl = process.env.RPC_URL || "https://mainnet.base.org";
    console.log(`📡 Connecting to: ${rpcUrl}`);
    console.log("");

    // ─── Connect ────────────────────────────────────────
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(signerKey, provider);

    const network = await provider.getNetwork();
    console.log(`🔗 Chain: ${network.name} (chainId: ${network.chainId})`);
    console.log(`👛 Signer: ${signer.address}`);

    const balance = await provider.getBalance(signer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    if (balance === 0n) {
        console.error("❌ Signer has no ETH for gas. Fund the wallet first.");
        process.exit(1);
    }
    console.log("");

    // ─── Register Schema ───────────────────────────────
    console.log(`📋 Schema: "${SCHEMA_STRING}"`);
    console.log(`📋 Revocable: ${REVOCABLE}`);
    console.log(`📋 Registry: ${SCHEMA_REGISTRY_ADDRESS}`);
    console.log("");

    const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
    schemaRegistry.connect(signer as any);

    console.log("⏳ Registering schema on-chain (this sends a transaction)...");

    const tx = await schemaRegistry.register({
        schema: SCHEMA_STRING,
        revocable: REVOCABLE,
    });

    console.log(`📤 Transaction sent: ${tx}`);
    console.log("⏳ Waiting for confirmation...");

    const schemaUid = await tx;
    console.log("");
    console.log("═══════════════════════════════════════════════");
    console.log(`✅ Schema registered!`);
    console.log(`📋 EAS_SCHEMA_UID=${schemaUid}`);
    console.log("═══════════════════════════════════════════════");
    console.log("");
    console.log("Add this to your .env file:");
    console.log(`  EAS_SCHEMA_UID=${schemaUid}`);
}

main().catch((err) => {
    console.error("❌ Error:", err.message || err);
    process.exit(1);
});
