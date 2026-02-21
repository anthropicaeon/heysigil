// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {SigilEscrow} from "../src/SigilEscrow.sol";

/// @title DeployEscrow — Standalone Multi-Token Escrow Deployment
/// @notice Deploys the new multi-token SigilEscrow contract.
///         After deployment, call locker.setTokenEscrow(newEscrowAddress)
///         to wire it up.
contract DeployEscrow is Script {
    function run() external {
        address deployer = msg.sender;
        address devWallet = vm.envOr("DEV_WALLET", deployer);
        address protocol = vm.envOr("PROTOCOL_ADDRESS", deployer);

        require(devWallet != address(0), "devWallet");
        require(protocol != address(0), "protocol");

        console.log("=== Sigil Multi-Token Escrow Deploy ===");
        console.log("Deployer:", deployer);
        console.log("Chain:   ", block.chainid);
        console.log("Dev Wallet:", devWallet);
        console.log("Protocol:", protocol);

        vm.startBroadcast();

        SigilEscrow escrow = new SigilEscrow(devWallet, protocol);
        console.log("SigilEscrow:", address(escrow));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DONE ===");
        console.log("SIGIL_ESCROW_ADDRESS=", address(escrow));
        console.log("");
        console.log("Next: call locker.setTokenEscrow(", address(escrow), ")");
        console.log("LPLocker: 0xb7C722Ae7B514bBd6595149a7251d32c1179bee0");
    }
}
