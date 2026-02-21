// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {SigilToken} from "../src/SigilToken.sol";

/// @title DeploySigilV2
/// @notice Deploy the SIGIL V2 token with all supply to deployer.
///
///   Usage:
///     forge script script/DeploySigilV2.s.sol:DeploySigilV2 \
///       --rpc-url $BASE_RPC_URL \
///       --private-key $DEPLOYER_PRIVATE_KEY \
///       --broadcast \
///       --verify \
///       --etherscan-api-key $BASESCAN_API_KEY
contract DeploySigilV2 is Script {
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000 ether; // 100B tokens

    function run() external {
        console2.log("Deploying SIGIL V2 Token...");
        console2.log("  Supply:", TOTAL_SUPPLY / 1 ether, "tokens");

        vm.startBroadcast();

        SigilToken token = new SigilToken("Sigil", "SIGIL", TOTAL_SUPPLY, msg.sender);

        vm.stopBroadcast();

        console2.log("  Token:", address(token));
        console2.log("  Owner (all supply):", msg.sender);
        console2.log("");
        console2.log("Next steps:");
        console2.log("  1. Deploy SigilMigrator with V1 + V2 addresses");
        console2.log("  2. Transfer migration supply to migrator");
        console2.log("  3. Set allocations from snapshot");
    }
}
