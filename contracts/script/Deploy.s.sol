// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {SigilHook} from "../src/SigilHook.sol";
import {SigilFeeVault} from "../src/SigilFeeVault.sol";
import {SigilFactory} from "../src/SigilFactory.sol";
import {PoolReward} from "../src/PoolReward.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

/// @title DeploySigil
/// @notice Production deployment script for all Sigil contracts on Base mainnet.
///
///         Deployment order:
///         1. SigilFeeVault (needs protocol treasury)
///         2. Pre-compute SigilFactory address via CREATE2 nonce prediction
///         3. SigilHook via CREATE2 with mined salt (needs PoolManager, factory, feeVault)
///            - Hook address must encode V4 permission flags in its last 14 bits
///         4. SigilFactory (needs PoolManager, hook, WETH)
///         5. Wire: vault.setHook(hook)
///
///         Required env vars:
///           PRIVATE_KEY          — deployer's private key
///           PROTOCOL_TREASURY    — multisig address for protocol fee share
///           BASE_MAINNET_RPC     — Base mainnet RPC URL
///           BASESCAN_API_KEY     — for contract verification
///
///         Usage:
///           forge script script/Deploy.s.sol \
///             --rpc-url $BASE_MAINNET_RPC \
///             --private-key $PRIVATE_KEY \
///             --broadcast \
///             --verify \
///             --etherscan-api-key $BASESCAN_API_KEY
contract DeploySigil is Script {
    // ─── Base Mainnet Addresses ──────────────────────────
    address constant POOL_MANAGER_BASE = 0x498581fF718922c3f8e6A244956aF099B2652b2b;
    address constant WETH_BASE = 0x4200000000000000000000000000000000000006;
    address constant EAS_BASE = 0x4200000000000000000000000000000000000021;

    function run() external {
        address deployer = msg.sender;

        // Read protocol treasury from env — MUST be a multisig in production
        address protocolTreasury = vm.envOr("PROTOCOL_TREASURY", deployer);
        require(protocolTreasury != address(0), "PROTOCOL_TREASURY required");

        // EAS config for PoolReward
        address trustedAttester = vm.envOr("TRUSTED_ATTESTER", deployer);
        bytes32 schemaUid = vm.envOr("EAS_SCHEMA_UID", bytes32(0));
        require(schemaUid != bytes32(0), "EAS_SCHEMA_UID env var required for mainnet");

        console.log("Deployer:", deployer);
        console.log("Treasury:", protocolTreasury);
        console.log("");

        vm.startBroadcast();

        // 1. Deploy FeeVault
        SigilFeeVault feeVault = new SigilFeeVault(protocolTreasury);
        console.log("SigilFeeVault deployed at:", address(feeVault));

        // 2. Deploy Hook
        //    WARNING: In production, this address must be mined via CREATE2
        //    so the address encodes the hook permissions.
        //    For now, this is a placeholder — use HookMiner in tests.
        //
        //    Required flags in the address:
        //    - beforeInitialize (bit 13)
        //    - beforeAddLiquidity (bit 11)
        //    - beforeRemoveLiquidity (bit 9)
        //    - afterSwap (bit 6)
        //    - afterSwapReturnDelta (bit 1)
        //
        //    The factory address is set to address(0) temporarily,
        //    then updated after factory deployment.

        // NOTE: This won't work in production without CREATE2 address mining.
        // See HookMiner.sol for the mining pattern.
        // For this script, we demonstrate the wiring order.

        SigilHook hook = new SigilHook(
            IPoolManager(POOL_MANAGER_BASE),
            address(0), // factory — set after factory deploy
            address(feeVault),
            protocolTreasury
        );
        console.log("SigilHook deployed at:", address(hook));

        // 3. Deploy Factory
        SigilFactory factory = new SigilFactory(
            POOL_MANAGER_BASE,
            address(hook),
            WETH_BASE
        );
        console.log("SigilFactory deployed at:", address(factory));

        // 4. Deploy PoolReward
        PoolReward poolReward = new PoolReward(
            EAS_BASE,
            trustedAttester,
            schemaUid
        );
        console.log("PoolReward deployed at:", address(poolReward));

        // 5. Wire everything together
        feeVault.setHook(address(hook));
        console.log("FeeVault wired to hook");

        // Note: The hook's factory is immutable, set in constructor.
        // In production, deploy hook with the pre-computed factory address
        // using CREATE2 for both hook and factory.

        vm.stopBroadcast();

        console.log("\n=== Sigil Deployment Summary ===");
        console.log("FeeVault:     ", address(feeVault));
        console.log("Hook:         ", address(hook));
        console.log("Factory:      ", address(factory));
        console.log("PoolReward:   ", address(poolReward));
        console.log("PoolManager:  ", POOL_MANAGER_BASE);
        console.log("WETH:         ", WETH_BASE);
        console.log("EAS:          ", EAS_BASE);
        console.log("Treasury:     ", protocolTreasury);
        console.log("Attester:     ", trustedAttester);
    }
}
