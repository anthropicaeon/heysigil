// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";

/// @title ISigilHook
/// @notice Interface for external contracts to interact with the SigilHook
interface ISigilHook {
    function registerPool(PoolKey calldata key, address dev, bool tokenIsCurrency0) external;
    function getPoolInfo(PoolId poolId) external view returns (bool registered, address dev, bool tokenIsToken0);
    function isRegisteredPool(PoolId poolId) external view returns (bool);
    function poolDev(PoolId poolId) external view returns (address);
}
