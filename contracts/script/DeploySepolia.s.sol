// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {SigilHook} from "../src/SigilHook.sol";
import {SigilFeeVault} from "../src/SigilFeeVault.sol";
import {SigilFactory} from "../src/SigilFactory.sol";
import {PoolReward} from "../src/PoolReward.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

/// @title DeploySigilSepolia
/// @notice Deployment script for all Sigil contracts on Base Sepolia testnet.
///
///         This is a simplified deployment for testing — it does NOT use CREATE2
///         address mining for the hook. On testnet this is acceptable since
///         we're validating the wiring and flow, not production-grade hook routing.
///
///         Required env vars:
///           PRIVATE_KEY      — deployer's private key
///           BASE_SEPOLIA_RPC — RPC URL (e.g., https://sepolia.base.org)
///
///         Optional env vars:
///           TRUSTED_ATTESTER — address of the backend EAS signer (defaults to deployer)
///           EAS_SCHEMA_UID   — schema UID from register-schema.ts
///
///         Usage:
///           forge script script/DeploySepolia.s.sol \
///             --rpc-url $BASE_SEPOLIA_RPC \
///             --private-key $PRIVATE_KEY \
///             --broadcast \
///             --verify \
///             --etherscan-api-key $BASESCAN_API_KEY
contract DeploySigilSepolia is Script {
    // ─── Base Sepolia Addresses ──────────────────────────
    // NOTE: These are Base Sepolia testnet addresses.
    //       Verify against latest Uniswap V4 docs before deploying.
    address constant POOL_MANAGER_SEPOLIA = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;
    address constant USDC_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    // EAS on Base Sepolia (OP Stack predeploy — same address as mainnet)
    address constant EAS_SEPOLIA = 0x4200000000000000000000000000000000000021;

    function run() external {
        address deployer = msg.sender;
        address protocolTreasury = deployer; // Use deployer as treasury on testnet

        // EAS config for PoolReward
        address trustedAttester = vm.envOr("TRUSTED_ATTESTER", deployer);
        bytes32 schemaUid = vm.envOr("EAS_SCHEMA_UID", bytes32(0));

        console.log("Deployer:", deployer);
        console.log("Target chain: Base Sepolia");
        console.log("");

        vm.startBroadcast();

        // ─── 1. Deploy FeeVault ──────────────────────────
        SigilFeeVault feeVault = new SigilFeeVault(protocolTreasury);
        console.log("SigilFeeVault deployed at:", address(feeVault));

        // ─── 2. Deploy Hook ─────────────────────────────
        // NOTE: On testnet we skip CREATE2 address mining.
        // The hook address won't encode permissions correctly,
        // which means V4 pool initialization may fail on testnet
        // if the PoolManager strictly enforces address-based permissions.
        //
        // For full integration testing, use the production Deploy.s.sol
        // with HookMiner on a fork.
        //
        // Setting factory to address(0) initially, updated after factory deploy.
        address tokenEscrow = deployer; // Placeholder — use proper escrow in production

        SigilHook hook = new SigilHook(
            IPoolManager(POOL_MANAGER_SEPOLIA),
            address(0), // factory — set after factory deploy
            address(feeVault),
            protocolTreasury,
            USDC_SEPOLIA,
            tokenEscrow
        );
        console.log("SigilHook deployed at:", address(hook));

        // ─── 3. Deploy Factory ──────────────────────────
        SigilFactory factory = new SigilFactory(
            POOL_MANAGER_SEPOLIA,
            address(hook),
            USDC_SEPOLIA
        );
        console.log("SigilFactory deployed at:", address(factory));

        // ─── 4. Deploy PoolReward ───────────────────────
        PoolReward poolReward = new PoolReward(
            EAS_SEPOLIA,
            trustedAttester,
            schemaUid
        );
        console.log("PoolReward deployed at:", address(poolReward));

        // ─── 5. Wire everything together ────────────────
        feeVault.setHook(address(hook));
        console.log("FeeVault wired to hook");

        vm.stopBroadcast();

        // ─── Summary ────────────────────────────────────
        console.log("");
        console.log("=== Sigil Testnet Deployment Summary ===");
        console.log("Network:      Base Sepolia");
        console.log("FeeVault:     ", address(feeVault));
        console.log("Hook:         ", address(hook));
        console.log("Factory:      ", address(factory));
        console.log("PoolReward:   ", address(poolReward));
        console.log("PoolManager:  ", POOL_MANAGER_SEPOLIA);
        console.log("USDC:         ", USDC_SEPOLIA);
        console.log("EAS:          ", EAS_SEPOLIA);
        console.log("Treasury:     ", protocolTreasury);
        console.log("Attester:     ", trustedAttester);
        console.log("");
        console.log("NOTE: Hook address is NOT mined - pool creation will fail");
        console.log("      if PoolManager enforces address-based permissions.");
        console.log("      Use Deploy.s.sol with HookMiner for production.");
    }
}
