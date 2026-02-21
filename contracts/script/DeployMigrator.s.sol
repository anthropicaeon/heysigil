// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {SigilMigrator} from "../src/SigilMigrator.sol";

/// @title DeployMigrator
/// @notice Deploy SigilMigrator for V1 → V2 token migration.
///
///   Usage:
///     forge script script/DeployMigrator.s.sol:DeployMigrator \
///       --rpc-url $BASE_RPC_URL \
///       --private-key $PRIVATE_KEY \
///       --broadcast \
///       --verify \
///       --etherscan-api-key $BASESCAN_API_KEY
///
///   Environment:
///     V1_TOKEN   — V1 HeySigil token address
///     V2_TOKEN   — V2 SIGIL token address
contract DeployMigrator is Script {
    function run() external {
        address v1 = vm.envAddress("V1_TOKEN");
        address v2 = vm.envAddress("V2_TOKEN");

        console2.log("Deploying SigilMigrator...");
        console2.log("  V1 Token:", v1);
        console2.log("  V2 Token:", v2);

        vm.startBroadcast();

        SigilMigrator migrator = new SigilMigrator(v1, v2);

        vm.stopBroadcast();

        console2.log("  Migrator:", address(migrator));
        console2.log("  Owner:   ", migrator.owner());
        console2.log("");
        console2.log("Next steps:");
        console2.log("  1. Transfer V2 tokens to the migrator contract");
        console2.log("  2. Call setAllocations() with snapshot data");
        console2.log("  3. Announce migration window to V1 holders");
    }
}
