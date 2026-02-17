// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {SigilFeeVault} from "../src/SigilFeeVault.sol";
import {SigilLPLocker} from "../src/SigilLPLocker.sol";
import {SigilFactoryV3} from "../src/SigilFactoryV3.sol";
import {SigilEscrow} from "../src/SigilEscrow.sol";

/// @title DeployV3 — V3 Migration Deployment
/// @notice Deploys Sigil V3 contracts on Base mainnet.
///         No hook mining needed (V3 has no hooks).
contract DeployV3 is Script {
    // ─── Base Mainnet Addresses ──────────────────────────
    address constant V3_FACTORY = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;
    address constant POSITION_MANAGER = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        address deployer = msg.sender;
        address treasury = vm.envOr("PROTOCOL_TREASURY", deployer);
        address tokenEscrow = vm.envOr("TOKEN_ESCROW", deployer);

        require(treasury != address(0), "treasury");
        require(tokenEscrow != address(0), "tokenEscrow");

        console.log("=== Sigil V3 Deploy ===");
        console.log("Deployer:", deployer);
        console.log("Chain:   ", block.chainid);
        console.log("Token Escrow:", tokenEscrow);

        vm.startBroadcast();

        // 1. Deploy FeeVault (or reuse existing)
        SigilFeeVault feeVault = new SigilFeeVault(treasury);
        console.log("FeeVault:", address(feeVault));

        // 2. Predict factory address for locker constructor
        uint64 nonce = vm.getNonce(deployer);
        address predictedFactory = vm.computeCreateAddress(deployer, nonce + 1);
        console.log("Predicted Factory:", predictedFactory);

        // 3. Deploy LP Locker
        SigilLPLocker locker = new SigilLPLocker(
            POSITION_MANAGER,
            address(feeVault),
            predictedFactory,
            USDC,
            tokenEscrow
        );
        console.log("LP Locker:", address(locker));

        // 4. Deploy Factory V3
        SigilFactoryV3 factory = new SigilFactoryV3(
            V3_FACTORY,
            POSITION_MANAGER,
            address(locker),
            USDC
        );
        require(address(factory) == predictedFactory, "factory addr mismatch");
        console.log("Factory V3:", address(factory));

        // 5. Wire FeeVault → Locker as authorized depositor
        feeVault.setAuthorizedDepositor(address(locker));
        console.log("Wired FeeVault -> Locker");

        vm.stopBroadcast();

        console.log("");
        console.log("=== DONE ===");
        console.log("SIGIL_FACTORY_ADDRESS=", address(factory));
        console.log("LP_LOCKER_ADDRESS=", address(locker));
        console.log("FEE_VAULT_ADDRESS=", address(feeVault));
    }
}
