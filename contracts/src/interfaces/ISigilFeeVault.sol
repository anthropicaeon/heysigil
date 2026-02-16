// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";

/// @title ISigilFeeVault
/// @notice Interface for the Sigil fee accumulation and claims vault
interface ISigilFeeVault {
    /// @notice Deposit fees from the hook after a swap.
    ///         Called by SigilHook with the split already calculated.
    ///
    ///         If dev == address(0), the dev share goes to escrow (unclaimed fees)
    ///         keyed by poolId instead of a dev address. These can be assigned later
    ///         via assignDev() or swept to protocol after 30 days.
    ///
    /// @param poolId The pool the fees came from
    /// @param dev The developer who receives the dev share (address(0) = unclaimed)
    /// @param token The fee token address
    /// @param devAmount Amount for the developer (80%)
    /// @param protocolAmount Amount for the protocol (20%)
    function depositFees(
        PoolId poolId,
        address dev,
        address token,
        uint256 devAmount,
        uint256 protocolAmount
    ) external;

    /// @notice Assign a verified dev to an unclaimed pool's escrowed fees.
    ///         Moves all accumulated unclaimed fees for that pool to the dev's balance.
    ///         Only callable by owner (backend after verification).
    /// @param poolId The pool to assign
    /// @param dev The verified developer wallet
    function assignDev(PoolId poolId, address dev) external;
}
