import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import type { AttestationData, AttestationResult } from "./types.js";
import { getEnv } from "../config/env.js";

// EAS schema for pool claim verifications
const SCHEMA_STRING =
  "string platform,string projectId,address wallet,uint64 verifiedAt,bool isOwner";

let _eas: EAS | null = null;
let _schemaEncoder: SchemaEncoder | null = null;

function getEAS(): EAS {
  if (!_eas) {
    const env = getEnv();
    _eas = new EAS(env.EAS_CONTRACT_ADDRESS);
  }
  return _eas;
}

function getSchemaEncoder(): SchemaEncoder {
  if (!_schemaEncoder) {
    _schemaEncoder = new SchemaEncoder(SCHEMA_STRING);
  }
  return _schemaEncoder;
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

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(env.ATTESTATION_SIGNER_KEY, provider);

  const eas = getEAS();
  eas.connect(signer);

  const encoder = getSchemaEncoder();
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
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const eas = getEAS();
  eas.connect(provider);

  const attestation = await eas.getAttestation(uid);

  if (!attestation || attestation.uid === ethers.ZeroHash) {
    return null;
  }

  // Decode the attestation data
  const encoder = getSchemaEncoder();
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
