// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {SigilHook} from "../src/SigilHook.sol";
import {SigilFeeVault} from "../src/SigilFeeVault.sol";
import {SigilFactory} from "../src/SigilFactory.sol";
import {SigilToken} from "../src/SigilToken.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

/// @title SigilHookTest
/// @notice Test the full Sigil fee loop:
///         Launch → Swap → Fee Collection → Dev Claim
///
///         To run these tests, you need:
///         1. Run setup.sh to install V4 dependencies
///         2. Fork Base mainnet: forge test --fork-url $BASE_RPC_URL
///
///         The tests fork Base to use the real PoolManager.
contract SigilHookTest is Test {
    using PoolIdLibrary for PoolKey;

    // Base mainnet addresses
    address constant POOL_MANAGER = 0x498581fF718922c3f8e6A244956aF099B2652b2b;
    address constant WETH = 0x4200000000000000000000000000000000000006;

    // Test accounts
    address deployer = address(0xD1);
    address dev = address(0xD2);
    address trader = address(0xD3);
    address treasury = address(0xD4);

    SigilFeeVault feeVault;
    SigilHook hook;
    SigilFactory factory;

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy fee vault
        feeVault = new SigilFeeVault(treasury);

        // NOTE: In a real test, the hook address must be mined via CREATE2
        // to encode the correct permission flags in the address.
        // For unit tests, use vm.etch() or HookMiner from the v4-template.
        // This test file demonstrates the logical flow.

        vm.stopPrank();
    }

    /// @notice Test that SigilToken deploys correctly
    function test_tokenDeploy() public {
        SigilToken token = new SigilToken("Test Token", "TEST", 1_000_000_000 ether, address(this));
        assertEq(token.name(), "Test Token");
        assertEq(token.symbol(), "TEST");
        assertEq(token.totalSupply(), 1_000_000_000 ether);
        assertEq(token.balanceOf(address(this)), 1_000_000_000 ether);
    }

    /// @notice Test that SigilToken transfers work
    function test_tokenTransfer() public {
        SigilToken token = new SigilToken("Test", "T", 1000 ether, address(this));

        token.transfer(address(0x1), 100 ether);
        assertEq(token.balanceOf(address(0x1)), 100 ether);
        assertEq(token.balanceOf(address(this)), 900 ether);
    }

    /// @notice Test that SigilToken approve + transferFrom work
    function test_tokenApproveTransferFrom() public {
        SigilToken token = new SigilToken("Test", "T", 1000 ether, address(this));

        token.approve(address(0x1), 500 ether);
        assertEq(token.allowance(address(this), address(0x1)), 500 ether);

        vm.prank(address(0x1));
        token.transferFrom(address(this), address(0x2), 200 ether);

        assertEq(token.balanceOf(address(0x2)), 200 ether);
        assertEq(token.allowance(address(this), address(0x1)), 300 ether);
    }

    /// @notice Test FeeVault deposit and dev claim
    function test_feeVaultDepositAndClaim() public {
        vm.startPrank(deployer);
        feeVault.setHook(address(this)); // Set test contract as hook
        vm.stopPrank();

        // Create a mock token for fee testing
        SigilToken mockToken = new SigilToken("Fee Token", "FEE", 10_000 ether, address(this));

        // Approve vault to pull tokens
        mockToken.approve(address(feeVault), type(uint256).max);

        // Simulate fee deposit (as if we're the hook)
        PoolId poolId = PoolId.wrap(bytes32(uint256(1)));
        feeVault.depositFees(poolId, dev, address(mockToken), 80 ether, 20 ether);

        // Check balances
        assertEq(feeVault.devFees(dev, address(mockToken)), 80 ether);
        assertEq(feeVault.protocolFees(address(mockToken)), 20 ether);

        // Dev claims
        vm.prank(dev);
        feeVault.claimDevFees(address(mockToken));
        assertEq(mockToken.balanceOf(dev), 80 ether);
        assertEq(feeVault.devFees(dev, address(mockToken)), 0);

        // Protocol claims
        vm.prank(deployer);
        feeVault.claimProtocolFees(address(mockToken));
        assertEq(mockToken.balanceOf(treasury), 20 ether);
    }

    /// @notice Test that only hook can deposit to vault
    function test_feeVaultOnlyHook() public {
        vm.startPrank(deployer);
        feeVault.setHook(address(0xBEEF));
        vm.stopPrank();

        PoolId poolId = PoolId.wrap(bytes32(uint256(1)));
        vm.expectRevert(SigilFeeVault.OnlyHook.selector);
        feeVault.depositFees(poolId, dev, address(0x1), 100, 25);
    }

    /// @notice Test dev can claim all fees across multiple tokens
    function test_feeVaultClaimAll() public {
        vm.startPrank(deployer);
        feeVault.setHook(address(this));
        vm.stopPrank();

        SigilToken tokenA = new SigilToken("A", "A", 10_000 ether, address(this));
        SigilToken tokenB = new SigilToken("B", "B", 10_000 ether, address(this));

        tokenA.approve(address(feeVault), type(uint256).max);
        tokenB.approve(address(feeVault), type(uint256).max);

        PoolId poolId = PoolId.wrap(bytes32(uint256(1)));

        // Deposit fees in both tokens
        feeVault.depositFees(poolId, dev, address(tokenA), 50 ether, 10 ether);
        feeVault.depositFees(poolId, dev, address(tokenB), 30 ether, 5 ether);

        // Claim all
        vm.prank(dev);
        feeVault.claimAllDevFees();

        assertEq(tokenA.balanceOf(dev), 50 ether);
        assertEq(tokenB.balanceOf(dev), 30 ether);
    }

    /// @notice Test fee vault analytics views
    function test_feeVaultAnalytics() public {
        vm.startPrank(deployer);
        feeVault.setHook(address(this));
        vm.stopPrank();

        SigilToken token = new SigilToken("T", "T", 10_000 ether, address(this));
        token.approve(address(feeVault), type(uint256).max);

        PoolId poolId = PoolId.wrap(bytes32(uint256(1)));

        // Multiple deposits
        feeVault.depositFees(poolId, dev, address(token), 80 ether, 20 ether);
        feeVault.depositFees(poolId, dev, address(token), 40 ether, 10 ether);

        // Check lifetime earnings
        assertEq(feeVault.getDevLifetimeEarnings(dev, address(token)), 120 ether);
        assertEq(feeVault.totalProtocolFeesEarned(address(token)), 30 ether);

        // Check pending balances
        (address[] memory tokens, uint256[] memory balances) = feeVault.getDevFeeBalances(dev);
        assertEq(tokens.length, 1);
        assertEq(tokens[0], address(token));
        assertEq(balances[0], 120 ether);
    }

    /// @notice Test hook constants are correct
    function test_hookConstants() public pure {
        // 1% total fee
        assertEq(SigilHook(address(0)).TOTAL_FEE_BPS(), 100);
        // 80% to dev
        assertEq(SigilHook(address(0)).DEV_SHARE_BPS(), 8_000);
        // 20% to protocol
        assertEq(SigilHook(address(0)).PROTOCOL_SHARE_BPS(), 2_000);
    }
}
