// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {SigilFeeVault} from "../src/SigilFeeVault.sol";
import {SigilToken} from "../src/SigilToken.sol";

/// @title FeeRoutingTest
/// @notice Tests the fee routing logic end-to-end:
///
///         1. Self-launch: 80% goes directly to dev, 20% to protocol ✓
///         2. Third-party launch (dev=address(0)): 80% goes to escrow ✓
///         3. Dev verifies → setDevForPool() moves escrow to dev balance ✓
///         4. 30-day expiry → sweepExpiredFees() moves escrow to protocol ✓
///         5. Protocol 20% ALWAYS goes to protocol regardless of dev status ✓
///         6. Dev reassignment: setDevForPool() called multiple times ✓
///
///         These tests simulate the FeeVault directly (as if the hook is calling
///         depositFees). They don't require a V4 fork — they test the vault logic.
contract FeeRoutingTest is Test {
    SigilFeeVault feeVault;
    SigilToken feeToken;

    // Test accounts
    address deployer = address(0xD1);
    address dev = address(0xD2);
    address devB = address(0xD3);
    address treasury = address(0xD4);

    // Pool IDs for different scenarios
    bytes32 selfLaunchPool = bytes32(uint256(100));
    bytes32 thirdPartyPool = bytes32(uint256(200));
    bytes32 expiryPool = bytes32(uint256(300));
    bytes32 reassignPool = bytes32(uint256(400));

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy fee vault
        feeVault = new SigilFeeVault(treasury);

        // Set test contract as the hook (so we can call depositFees)
        feeVault.setHook(address(this));

        vm.stopPrank();

        // Create a mock fee token and approve vault
        feeToken = new SigilToken("Fee Token", "FEE", 1_000_000 ether, address(this));
        feeToken.approve(address(feeVault), type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════
    //              SCENARIO 1: SELF-LAUNCH (dev known)
    // ═══════════════════════════════════════════════════════

    /// @notice Self-launch: 80% goes to dev, 20% to protocol. Dev claims.
    function test_selfLaunch_feesGoToDev() public {
        // Simulate swap fees: 100 total → 80 dev, 20 protocol
        feeVault.depositFees(selfLaunchPool, dev, address(feeToken), 80 ether, 20 ether);

        // Dev's balance should be 80
        assertEq(feeVault.devFees(dev, address(feeToken)), 80 ether, "Dev should have 80 fees");
        // Protocol should be 20
        assertEq(feeVault.protocolFees(address(feeToken)), 20 ether, "Protocol should have 20 fees");

        // Dev claims
        vm.prank(dev);
        feeVault.claimDevFees(address(feeToken));
        assertEq(feeToken.balanceOf(dev), 80 ether, "Dev should receive 80 tokens");
        assertEq(feeVault.devFees(dev, address(feeToken)), 0, "Dev balance should be 0 after claim");

        // Protocol claims
        vm.prank(deployer);
        feeVault.claimProtocolFees(address(feeToken));
        assertEq(feeToken.balanceOf(treasury), 20 ether, "Treasury should receive 20 tokens");
    }

    /// @notice Multiple swaps accumulate in dev balance
    function test_selfLaunch_multipleSwapsAccumulate() public {
        // 3 swaps
        feeVault.depositFees(selfLaunchPool, dev, address(feeToken), 80 ether, 20 ether);
        feeVault.depositFees(selfLaunchPool, dev, address(feeToken), 40 ether, 10 ether);
        feeVault.depositFees(selfLaunchPool, dev, address(feeToken), 16 ether, 4 ether);

        // Dev accumulates: 80 + 40 + 16 = 136
        assertEq(feeVault.devFees(dev, address(feeToken)), 136 ether);
        // Protocol accumulates: 20 + 10 + 4 = 34
        assertEq(feeVault.protocolFees(address(feeToken)), 34 ether);
        // Lifetime earnings tracked
        assertEq(feeVault.getDevLifetimeEarnings(dev, address(feeToken)), 136 ether);
    }

    // ═══════════════════════════════════════════════════════
    //         SCENARIO 2: THIRD-PARTY LAUNCH (dev=0)
    //              Fees go to escrow
    // ═══════════════════════════════════════════════════════

    /// @notice Third-party launch: 80% goes to escrow, NOT to any wallet
    function test_thirdPartyLaunch_feesGoToEscrow() public {
        // dev = address(0) → fees escrowed under poolId
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);

        // No dev should have these fees
        assertEq(feeVault.devFees(address(0), address(feeToken)), 0, "address(0) devFees should be 0");
        assertEq(feeVault.devFees(dev, address(feeToken)), 0, "Real dev should have 0 yet");

        // Protocol still gets their 20%
        assertEq(feeVault.protocolFees(address(feeToken)), 20 ether, "Protocol ALWAYS gets 20%");

        // Escrow should hold the dev share
        bytes32 poolKey = thirdPartyPool;
        assertEq(feeVault.unclaimedFees(poolKey, address(feeToken)), 80 ether, "Escrow should hold 80");
        assertTrue(feeVault.unclaimedDepositedAt(poolKey) > 0, "Deposit timestamp should be set");
    }

    /// @notice Multiple swaps accumulate in escrow
    function test_thirdPartyLaunch_multipleSwapsAccumulateInEscrow() public {
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 40 ether, 10 ether);

        bytes32 poolKey = thirdPartyPool;
        assertEq(feeVault.unclaimedFees(poolKey, address(feeToken)), 120 ether, "Escrow accumulates");
        assertEq(feeVault.protocolFees(address(feeToken)), 30 ether, "Protocol always accumulates");
    }

    /// @notice Verify the unclaimed view function works
    function test_thirdPartyLaunch_viewUnclaimedBalances() public {
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);

        (
            address[] memory tokens,
            uint256[] memory balances,
            uint256 depositedAt,
            bool expired,
            bool assigned
        ) = feeVault.getUnclaimedFeeBalances(thirdPartyPool);

        assertEq(tokens.length, 1);
        assertEq(tokens[0], address(feeToken));
        assertEq(balances[0], 80 ether);
        assertTrue(depositedAt > 0);
        assertFalse(expired, "Should not be expired yet");
        assertFalse(assigned, "Should not be assigned yet");
    }

    // ═══════════════════════════════════════════════════════
    //       SCENARIO 3: DEV VERIFIES → setDevForPool()
    //       Escrowed fees move to dev's claimable balance
    // ═══════════════════════════════════════════════════════

    /// @notice Dev verifies → setDevForPool() moves all escrowed fees to dev
    function test_setDevForPool_movesEscrowToDevBalance() public {
        // Third-party launch accumulates fees in escrow
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 40 ether, 10 ether);

        bytes32 poolKey = thirdPartyPool;
        assertEq(feeVault.unclaimedFees(poolKey, address(feeToken)), 120 ether);

        // Owner assigns dev after verification
        vm.prank(deployer);
        feeVault.setDevForPool(thirdPartyPool, dev);

        // Escrow should be empty
        assertEq(feeVault.unclaimedFees(poolKey, address(feeToken)), 0, "Escrow should be empty");

        // Dev should now have the fees
        assertEq(feeVault.devFees(dev, address(feeToken)), 120 ether, "Dev should have all escrowed fees");
        assertEq(feeVault.totalDevFeesEarned(dev, address(feeToken)), 120 ether, "Lifetime earnings tracked");

        // poolDev should track the assigned dev
        assertEq(feeVault.poolDev(thirdPartyPool), dev, "poolDev should track assigned dev");

        // Dev can now claim
        vm.prank(dev);
        feeVault.claimDevFees(address(feeToken));
        assertEq(feeToken.balanceOf(dev), 120 ether, "Dev should receive all escrowed tokens");
    }

    /// @notice setDevForPool can only be called by owner
    function test_setDevForPool_revertNotOwner() public {
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);

        vm.prank(address(0xBAD));
        vm.expectRevert(SigilFeeVault.OnlyOwner.selector);
        feeVault.setDevForPool(thirdPartyPool, dev);
    }

    /// @notice setDevForPool reverts with zero address
    function test_setDevForPool_revertZeroAddress() public {
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);

        vm.prank(deployer);
        vm.expectRevert(SigilFeeVault.ZeroAddress.selector);
        feeVault.setDevForPool(thirdPartyPool, address(0));
    }

    /// @notice setDevForPool is idempotent — calling with same dev twice is a noop
    function test_setDevForPool_idempotentSameDev() public {
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);

        vm.startPrank(deployer);

        // First call: moves escrow to dev
        feeVault.setDevForPool(thirdPartyPool, dev);
        assertEq(feeVault.devFees(dev, address(feeToken)), 80 ether);

        // Second call: noop (no escrow to move)
        feeVault.setDevForPool(thirdPartyPool, dev);
        assertEq(feeVault.devFees(dev, address(feeToken)), 80 ether, "Second call should be noop");

        vm.stopPrank();
    }

    /// @notice setDevForPool can be called with no unclaimed fees — safe noop
    function test_setDevForPool_noopWhenNoFees() public {
        // No deposits for this pool
        vm.prank(deployer);
        feeVault.setDevForPool(thirdPartyPool, dev);

        // poolDev is set even without fees
        assertEq(feeVault.poolDev(thirdPartyPool), dev, "poolDev should be set");
        assertEq(feeVault.devFees(dev, address(feeToken)), 0, "No fees to move");
    }

    // ═══════════════════════════════════════════════════════
    //       SCENARIO 3B: DEV REASSIGNMENT
    //       setDevForPool() called with different dev addresses
    // ═══════════════════════════════════════════════════════

    /// @notice Reassign: devA gets initial escrow, new fees accumulate, devB gets new escrow
    function test_setDevForPool_reassignToNewDev() public {
        // Phase 1: third-party launch, fees accumulate in escrow
        feeVault.depositFees(reassignPool, address(0), address(feeToken), 80 ether, 20 ether);

        // Phase 2: devA verifies
        vm.prank(deployer);
        feeVault.setDevForPool(reassignPool, dev);
        assertEq(feeVault.devFees(dev, address(feeToken)), 80 ether, "DevA gets initial escrow");
        assertEq(feeVault.poolDev(reassignPool), dev, "poolDev should be devA");

        // Phase 3: more fees accumulate in escrow (deposited with address(0))
        feeVault.depositFees(reassignPool, address(0), address(feeToken), 40 ether, 10 ether);

        // Phase 4: devB verifies → reassign
        vm.prank(deployer);
        feeVault.setDevForPool(reassignPool, devB);

        // DevA keeps their original 80, devB gets the new 40
        assertEq(feeVault.devFees(dev, address(feeToken)), 80 ether, "DevA keeps their fees");
        assertEq(feeVault.devFees(devB, address(feeToken)), 40 ether, "DevB gets new escrow");
        assertEq(feeVault.poolDev(reassignPool), devB, "poolDev should now be devB");

        // Both can claim
        vm.prank(dev);
        feeVault.claimDevFees(address(feeToken));
        assertEq(feeToken.balanceOf(dev), 80 ether);

        vm.prank(devB);
        feeVault.claimDevFees(address(feeToken));
        assertEq(feeToken.balanceOf(devB), 40 ether);
    }

    /// @notice Reassign multiple times — each call only sweeps current escrow
    function test_setDevForPool_multipleReassignments() public {
        vm.startPrank(deployer);

        // Assign devA (no fees yet)
        feeVault.setDevForPool(reassignPool, dev);
        assertEq(feeVault.poolDev(reassignPool), dev);

        // Reassign to devB (no fees yet)
        feeVault.setDevForPool(reassignPool, devB);
        assertEq(feeVault.poolDev(reassignPool), devB);

        // Reassign back to devA (no fees yet)
        feeVault.setDevForPool(reassignPool, dev);
        assertEq(feeVault.poolDev(reassignPool), dev);

        vm.stopPrank();

        // Now deposit and assign — devA gets everything
        feeVault.depositFees(reassignPool, address(0), address(feeToken), 100 ether, 25 ether);
        vm.prank(deployer);
        feeVault.setDevForPool(reassignPool, dev);

        assertEq(feeVault.devFees(dev, address(feeToken)), 100 ether);
        assertEq(feeVault.devFees(devB, address(feeToken)), 0);
    }

    // ═══════════════════════════════════════════════════════
    //       SCENARIO 4: 30-DAY EXPIRY → sweep to protocol
    // ═══════════════════════════════════════════════════════

    /// @notice After 30 days, anyone can sweep unclaimed fees to protocol
    function test_sweepExpiredFees_movesToProtocol() public {
        feeVault.depositFees(expiryPool, address(0), address(feeToken), 80 ether, 20 ether);

        bytes32 poolKey = expiryPool;

        // Can't sweep before 30 days
        vm.expectRevert(SigilFeeVault.NotExpiredYet.selector);
        feeVault.sweepExpiredFees(expiryPool);

        // Warp forward 30 days + 1 second
        vm.warp(block.timestamp + 30 days + 1);

        // Anyone can sweep
        feeVault.sweepExpiredFees(expiryPool);

        // Escrow is empty
        assertEq(feeVault.unclaimedFees(poolKey, address(feeToken)), 0, "Escrow empty after sweep");

        // Protocol gets the expired fees (20 original + 80 expired = 100)
        assertEq(feeVault.protocolFees(address(feeToken)), 100 ether, "Protocol gets original 20 + expired 80");

        // Protocol can claim all
        vm.prank(deployer);
        feeVault.claimProtocolFees(address(feeToken));
        assertEq(feeToken.balanceOf(treasury), 100 ether, "Treasury gets full 100");
    }

    /// @notice Sweep resets timestamp so new fees get a fresh 30-day window
    function test_sweepExpiredFees_resetsTimestamp() public {
        feeVault.depositFees(expiryPool, address(0), address(feeToken), 80 ether, 20 ether);

        bytes32 poolKey = expiryPool;

        // Warp forward and sweep
        vm.warp(block.timestamp + 30 days + 1);
        feeVault.sweepExpiredFees(expiryPool);

        // Timestamp should be reset
        assertEq(feeVault.unclaimedDepositedAt(poolKey), 0, "Timestamp reset after sweep");

        // New fees get deposited — fresh 30-day window
        feeVault.depositFees(expiryPool, address(0), address(feeToken), 40 ether, 10 ether);
        assertTrue(feeVault.unclaimedDepositedAt(poolKey) > 0, "New timestamp set");

        // Can't sweep immediately
        vm.expectRevert(SigilFeeVault.NotExpiredYet.selector);
        feeVault.sweepExpiredFees(expiryPool);
    }

    /// @notice Sweep reverts if pool has a dev assigned (poolDev != address(0))
    function test_sweepExpiredFees_revertIfDevAssigned() public {
        feeVault.depositFees(expiryPool, address(0), address(feeToken), 80 ether, 20 ether);

        // Assign dev first
        vm.prank(deployer);
        feeVault.setDevForPool(expiryPool, dev);

        // Deposit new fees
        feeVault.depositFees(expiryPool, address(0), address(feeToken), 40 ether, 10 ether);

        // Warp forward
        vm.warp(block.timestamp + 30 days + 1);

        // Sweep should fail since pool has an active dev
        vm.expectRevert(bytes("SIGIL: POOL_HAS_DEV"));
        feeVault.sweepExpiredFees(expiryPool);
    }

    /// @notice Sweep reverts if no unclaimed fees exist
    function test_sweepExpiredFees_revertNoUnclaimed() public {
        vm.expectRevert(SigilFeeVault.NoUnclaimedFees.selector);
        feeVault.sweepExpiredFees(expiryPool);
    }

    // ═══════════════════════════════════════════════════════
    //       SCENARIO 5: PROTOCOL 20% ALWAYS WORKS
    // ═══════════════════════════════════════════════════════

    /// @notice Protocol always gets 20% regardless of dev status
    function test_protocolAlwaysGets20Percent() public {
        // Self-launch: protocol gets 20
        feeVault.depositFees(selfLaunchPool, dev, address(feeToken), 80 ether, 20 ether);
        assertEq(feeVault.protocolFees(address(feeToken)), 20 ether);

        // Third-party launch: protocol STILL gets 20
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);
        assertEq(feeVault.protocolFees(address(feeToken)), 40 ether, "Protocol accumulates from both");
    }

    // ═══════════════════════════════════════════════════════
    //       SCENARIO 6: MULTI-TOKEN ESCROW
    // ═══════════════════════════════════════════════════════

    /// @notice Fees in multiple tokens are all escrowed and assignable
    function test_multiTokenEscrow_assignMovesAll() public {
        SigilToken tokenB = new SigilToken("B", "B", 1_000_000 ether, address(this));
        tokenB.approve(address(feeVault), type(uint256).max);

        // Deposit fees in two different tokens
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);
        feeVault.depositFees(thirdPartyPool, address(0), address(tokenB), 40 ether, 10 ether);

        // Assign dev
        vm.prank(deployer);
        feeVault.setDevForPool(thirdPartyPool, dev);

        // Dev should have both
        assertEq(feeVault.devFees(dev, address(feeToken)), 80 ether);
        assertEq(feeVault.devFees(dev, address(tokenB)), 40 ether);

        // Dev claims all
        vm.prank(dev);
        feeVault.claimAllDevFees();

        assertEq(feeToken.balanceOf(dev), 80 ether);
        assertEq(tokenB.balanceOf(dev), 40 ether);
    }

    // ═══════════════════════════════════════════════════════
    //       SCENARIO 7: FULL LIFECYCLE
    // ═══════════════════════════════════════════════════════

    /// @notice Full lifecycle: third-party launch → swaps → dev verifies → claims
    function test_fullLifecycle_thirdPartyToClaim() public {
        // 1. Token launched for someone else's project (dev unknown)
        // 2. Trading begins — fees accumulate in escrow
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 80 ether, 20 ether);
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 40 ether, 10 ether);
        feeVault.depositFees(thirdPartyPool, address(0), address(feeToken), 16 ether, 4 ether);

        // Check escrow: 80 + 40 + 16 = 136
        bytes32 poolKey = thirdPartyPool;
        assertEq(feeVault.unclaimedFees(poolKey, address(feeToken)), 136 ether);
        // Protocol: 20 + 10 + 4 = 34 (always there)
        assertEq(feeVault.protocolFees(address(feeToken)), 34 ether);

        // 3. At day 15, dev verifies ownership through Sigil
        vm.warp(block.timestamp + 15 days);
        vm.prank(deployer);
        feeVault.setDevForPool(thirdPartyPool, dev);

        // 4. Dev claims all accumulated fees
        vm.prank(dev);
        feeVault.claimDevFees(address(feeToken));
        assertEq(feeToken.balanceOf(dev), 136 ether, "Dev gets ALL accumulated fees");

        // 5. Protocol claims their share
        vm.prank(deployer);
        feeVault.claimProtocolFees(address(feeToken));
        assertEq(feeToken.balanceOf(treasury), 34 ether, "Protocol gets their 20%");

        // 6. Balances clean
        assertEq(feeVault.devFees(dev, address(feeToken)), 0);
        assertEq(feeVault.protocolFees(address(feeToken)), 0);
    }

    /// @notice Full lifecycle: third-party launch → nobody claims → protocol sweeps
    function test_fullLifecycle_expiryToProtocol() public {
        // 1. Token launched, trading begins
        feeVault.depositFees(expiryPool, address(0), address(feeToken), 80 ether, 20 ether);

        // 2. 30 days pass, nobody claims
        vm.warp(block.timestamp + 31 days);

        // 3. Anyone triggers sweep
        feeVault.sweepExpiredFees(expiryPool);

        // 4. Protocol now has 20 (original) + 80 (expired) = 100
        assertEq(feeVault.protocolFees(address(feeToken)), 100 ether);

        // 5. Protocol claims everything
        vm.prank(deployer);
        feeVault.claimProtocolFees(address(feeToken));
        assertEq(feeToken.balanceOf(treasury), 100 ether, "Protocol gets ALL if unclaimed");
    }
}
