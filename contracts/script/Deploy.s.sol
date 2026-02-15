// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {SigilHook} from "../src/SigilHook.sol";
import {SigilFeeVault} from "../src/SigilFeeVault.sol";
import {SigilFactory} from "../src/SigilFactory.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

/// @title DeploySigil
/// @notice Deployment script for all Sigil contracts on Base.
///
///         Deployment order matters:
///         1. SigilFeeVault (needs protocol treasury)
///         2. SigilHook (needs PoolManager, factory address, feeVault)
///            - Hook address must be mined via CREATE2 to encode permissions
///         3. SigilFactory (needs PoolManager, hook, WETH)
///         4. Wire: vault.setHook(hook), hook needs factory address
///
///         Note: SigilHook requires a specific address prefix for V4 hook permissions.
///         In production, use CREATE2 with salt mining (HookMiner) to deploy the hook
///         at an address that encodes the correct permission flags.
contract DeploySigil is Script {
    // ─── Base Mainnet Addresses ──────────────────────────
    address constant POOL_MANAGER_BASE = 0x498581fF718922c3f8e6A244956aF099B2652b2b;
    address constant WETH_BASE = 0x4200000000000000000000000000000000000006;

    function run() external {
        address deployer = msg.sender;
        address protocolTreasury = deployer; // Update to multisig in production

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
        // See test/utils/HookMiner.sol for the mining pattern.
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

        // 4. Wire everything together
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
        console.log("PoolManager:  ", POOL_MANAGER_BASE);
        console.log("WETH:         ", WETH_BASE);
        console.log("Treasury:     ", protocolTreasury);
    }
}
