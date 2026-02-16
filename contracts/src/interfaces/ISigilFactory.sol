// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";

/// @title ISigilFactory
/// @notice Interface for the Sigil token launch factory
interface ISigilFactory {
    function launch(
        string calldata name,
        string calldata symbol,
        string calldata projectId,
        address dev
    ) external returns (address token, PoolId poolId);

    function getLaunchCount() external view returns (uint256);
    function getAllLaunches() external view returns (address[] memory);
}
