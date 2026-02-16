import type { AttestationData, AttestationResult } from "./types.js";
import { getEnv } from "../config/env.js";

// EAS schema for pool claim verifications
const SCHEMA_STRING =
  "string platform,string projectId,address wallet,uint64 verifiedAt,bool isOwner";

// Lazy-load EAS SDK and ethers to avoid ESM/CJS import crash at startup.
// These modules are only loaded when attestation functions are actually called.
async function loadEasModules() {
  const easMod = await import("@ethereum-attestation-service/eas-sdk");
  const ethersMod = await import("ethers");

  // Handle both default and named exports (CJS compat)
  const EAS = easMod.EAS || (easMod as any).default?.EAS;
  const SchemaEncoder = easMod.SchemaEncoder || (easMod as any).default?.SchemaEncoder;
  const ethersNs = ethersMod.ethers || ethersMod;

  if (!EAS || !SchemaEncoder) {
    throw new Error("Failed to load EAS SDK — check package version");
  }

  return { EAS, SchemaEncoder, ethers: ethersNs };
}

/**
 * Create an EAS attestation for a verified project ownership claim.
 *
 * This is called by the backend after a verification method succeeds.
 * The attestation becomes the on-chain proof that the pool reward contract checks.
 */
export async function createAttestation(
  data: AttestationData,
  rpcUrl: string,
): Promise<AttestationResult> {
  const env = getEnv();

  if (!env.ATTESTATION_SIGNER_KEY) {
    throw new Error("ATTESTATION_SIGNER_KEY not configured");
  }
  if (!env.EAS_SCHEMA_UID) {
    throw new Error("EAS_SCHEMA_UID not configured — register schema first");
  }

  const { EAS, SchemaEncoder, ethers } = await loadEasModules();

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(env.ATTESTATION_SIGNER_KEY, provider);

  const eas = new EAS(env.EAS_CONTRACT_ADDRESS);
  eas.connect(signer);

  const encoder = new SchemaEncoder(SCHEMA_STRING);
  const encodedData = encoder.encodeData([
    { name: "platform", value: data.platform, type: "string" },
    { name: "projectId", value: data.projectId, type: "string" },
    { name: "wallet", value: data.wallet, type: "address" },
    { name: "verifiedAt", value: BigInt(data.verifiedAt), type: "uint64" },
    { name: "isOwner", value: data.isOwner, type: "bool" },
  ]);

  const tx = await eas.attest({
    schema: env.EAS_SCHEMA_UID,
    data: {
      recipient: data.wallet,
      expirationTime: 0n, // No expiration
      revocable: true,
      data: encodedData,
    },
  });

  const uid = await tx.wait();
  const txHash = (tx.data as unknown as { hash: string }).hash ?? "";

  return {
    uid,
    txHash,
  };
}

/**
 * Read and validate an existing attestation.
 */
export async function getAttestation(uid: string, rpcUrl: string) {
  const { EAS, SchemaEncoder, ethers } = await loadEasModules();

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const eas = new EAS(getEnv().EAS_CONTRACT_ADDRESS);
  eas.connect(provider);

  const attestation = await eas.getAttestation(uid);

  if (!attestation || attestation.uid === ethers.ZeroHash) {
    return null;
  }

  // Decode the attestation data
  const encoder = new SchemaEncoder(SCHEMA_STRING);
  const decoded = encoder.decodeData(attestation.data);

  return {
    uid: attestation.uid,
    attester: attestation.attester,
    recipient: attestation.recipient,
    revoked: attestation.revocationTime > 0n,
    data: {
      platform: decoded[0].value.value as string,
      projectId: decoded[1].value.value as string,
      wallet: decoded[2].value.value as string,
      verifiedAt: Number(decoded[3].value.value as bigint),
      isOwner: decoded[4].value.value as boolean,
    },
  };
}
