// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEAS, Attestation} from "../../src/interfaces/IEAS.sol";

/// @title MockEAS
/// @notice Mock EAS contract for testing PoolReward.
///         Lets tests pre-configure attestation responses by UID.
contract MockEAS is IEAS {
    mapping(bytes32 => Attestation) private _attestations;

    /// @notice Store an attestation that `getAttestation` will return.
    function setAttestation(bytes32 uid, Attestation memory att) external {
        _attestations[uid] = att;
    }

    /// @notice Convenience: build and store a valid Sigil attestation.
    /// @param uid       The attestation UID
    /// @param attester  Who created the attestation (should be trustedAttester)
    /// @param recipient Who the attestation is for (the dev wallet)
    /// @param schema    Schema UID
    /// @param platform  e.g. "github"
    /// @param projectId e.g. "github.com/org/repo"
    /// @param wallet    The verified wallet address
    /// @param isOwner   Whether the attestation marks them as owner
    function setSigilAttestation(
        bytes32 uid,
        address attester,
        address recipient,
        bytes32 schema,
        string memory platform,
        string memory projectId,
        address wallet,
        bool isOwner
    ) external {
        _attestations[uid] = Attestation({
            uid: uid,
            schema: schema,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: recipient,
            attester: attester,
            revocable: true,
            data: abi.encode(platform, projectId, wallet, uint64(block.timestamp), isOwner)
        });
    }

    /// @notice Set the revocation time on an existing attestation.
    function revokeAttestation(bytes32 uid) external {
        _attestations[uid].revocationTime = uint64(block.timestamp);
    }

    function getAttestation(bytes32 uid) external view override returns (Attestation memory) {
        return _attestations[uid];
    }
}
