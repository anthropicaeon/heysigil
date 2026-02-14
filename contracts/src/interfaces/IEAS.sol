// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Attestation
 * @notice EAS attestation struct — matches the official EAS contract.
 */
struct Attestation {
    bytes32 uid;
    bytes32 schema;
    uint64 time;
    uint64 expirationTime;
    uint64 revocationTime;
    bytes32 refUID;
    address recipient;
    address attester;
    bool revocable;
    bytes data;
}

/**
 * @title IEAS
 * @notice Minimal interface for reading EAS attestations.
 */
interface IEAS {
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}
