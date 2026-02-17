// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ISigilFeeVault
/// @notice Interface for the Sigil fee accumulation and claims vault.
///         Supports both V3 (LPLocker) and V4 (Hook) depositors.
interface ISigilFeeVault {
    /// @notice Deposit fees from the authorized depositor.
    ///         Called by SigilLPLocker (V3) or SigilHook (V4) with the split already calculated.
    ///
    ///         If dev == address(0), the dev share goes to escrow (unclaimed fees)
    ///         keyed by poolId instead of a dev address. These can be assigned later
    ///         via assignDev() or swept to protocol after 30 days.
    ///
    /// @param poolId The pool identifier (bytes32)
    /// @param dev The developer who receives the dev share (address(0) = unclaimed)
    /// @param token The fee token address
    /// @param devAmount Amount for the developer (80%)
    /// @param protocolAmount Amount for the protocol (20%)
    function depositFees(
        bytes32 poolId,
        address dev,
        address token,
        uint256 devAmount,
        uint256 protocolAmount
    ) external;

    /// @notice Assign a verified dev to an unclaimed pool's escrowed fees.
    ///         Moves all accumulated unclaimed fees for that pool to the dev's balance.
    ///         Only callable by owner (backend after verification).
    /// @param poolId The pool identifier
    /// @param dev The verified developer wallet
    function assignDev(bytes32 poolId, address dev) external;
}
