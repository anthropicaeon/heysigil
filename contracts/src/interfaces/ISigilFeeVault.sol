// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";

/// @title ISigilFeeVault
/// @notice Interface for the Sigil fee accumulation and claims vault
interface ISigilFeeVault {
    /// @notice Deposit fees from the hook after a swap.
    ///         Called by SigilHook with the split already calculated.
    /// @param poolId The pool the fees came from
    /// @param dev The developer who receives the dev share
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
}
