// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {SigilHook} from "../src/SigilHook.sol";
import {SigilFeeVault} from "../src/SigilFeeVault.sol";
import {SigilFactory} from "../src/SigilFactory.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "./HookMiner.sol";

/// @title DeploySigil — Production Deployment with CREATE2 Hook Mining
/// @notice Deploys all Sigil contracts on Base mainnet.
contract DeploySigil is Script {
    // ─── Base Mainnet Addresses ──────────────────────────
    IPoolManager constant PM = IPoolManager(0x498581fF718922c3f8e6A244956aF099B2652b2b);
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant EAS = 0x4200000000000000000000000000000000000021;
    address constant C2 = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        address deployer = msg.sender;
        address treasury = vm.envOr("PROTOCOL_TREASURY", deployer);
        address attester = vm.envOr("TRUSTED_ATTESTER", deployer);
        address escrow = vm.envOr("TOKEN_ESCROW", deployer);


        require(treasury != address(0), "treasury");

        console.log("=== Sigil Production Deploy ===");
        console.log("Deployer:", deployer);
        console.log("Chain:   ", block.chainid);

        // Compute the hook permission flags
        uint160 flags = uint160(
            Hooks.BEFORE_INITIALIZE_FLAG |
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
            Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG |
            Hooks.AFTER_SWAP_FLAG |
            Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG
        );

        vm.startBroadcast();

        // 1. Deploy FeeVault
        SigilFeeVault feeVault = new SigilFeeVault(treasury);
        console.log("FeeVault:", address(feeVault));

        // 2. Predict factory address (factory deploys at nonce+1, after hook)
        uint64 nonce = vm.getNonce(deployer);
        address predictedFactory = vm.computeCreateAddress(deployer, nonce + 1);
        console.log("Predicted Factory:", predictedFactory);

        // 3. Mine hook salt + deploy
        address hookAddr;
        {
            bytes memory args = abi.encode(PM, predictedFactory, address(feeVault), treasury, USDC, escrow);
            bytes memory code = abi.encodePacked(type(SigilHook).creationCode, args);

            bytes32 salt;
            (hookAddr, salt) = HookMiner.find(C2, flags, code, 100_000);
            console.log("Mined hook:", hookAddr);

            // Verify flags
            uint160 mask = uint160((1 << 14) - 1);
            require(uint160(hookAddr) & mask == flags & mask, "bad flags");

            // Deploy via CREATE2
            SigilHook hook = new SigilHook{salt: salt}(PM, predictedFactory, address(feeVault), treasury, USDC, escrow);
            require(address(hook) == hookAddr, "hook addr mismatch");
            console.log("Hook deployed:", address(hook));
        }

        // 4. Deploy factory
        SigilFactory factory = new SigilFactory(address(PM), hookAddr, USDC);
        require(address(factory) == predictedFactory, "factory addr mismatch");
        console.log("Factory:", address(factory));

        // 5. Wire
        feeVault.setHook(hookAddr);
        console.log("Wired FeeVault -> Hook");

        vm.stopBroadcast();

        console.log("");
        console.log("=== DONE ===");
        console.log("SIGIL_FACTORY_ADDRESS=", address(factory));
    }
}
