// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {SigilMigrator} from "../src/SigilMigrator.sol";
import {SigilToken} from "../src/SigilToken.sol";

contract SigilMigratorTest is Test {
    SigilMigrator migrator;
    SigilToken v1;
    SigilToken v2;

    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address eve = address(0xEEE);

    uint256 constant SUPPLY = 100_000_000_000 ether;

    function setUp() public {
        // Deploy mock V1 and V2 tokens
        v1 = new SigilToken("HeySigil", "SIGIL", SUPPLY, owner);
        v2 = new SigilToken("Sigil V2", "SIGIL", SUPPLY, owner);

        // Deploy migrator
        migrator = new SigilMigrator(address(v1), address(v2));

        // Fund migrator with V2 tokens
        v2.transfer(address(migrator), SUPPLY);

        // Give alice and bob some V1 tokens
        v1.transfer(alice, 1000 ether);
        v1.transfer(bob, 500 ether);
    }

    // ─── Migration ───────────────────────────────────────

    function test_migrate_happyPath() public {
        // Set allocation
        migrator.setAllocation(alice, 1000 ether);

        // Alice approves and migrates
        vm.startPrank(alice);
        v1.approve(address(migrator), 600 ether);
        migrator.migrate(600 ether);
        vm.stopPrank();

        assertEq(v2.balanceOf(alice), 600 ether);
        assertEq(v1.balanceOf(alice), 400 ether);
        assertEq(v1.balanceOf(address(migrator)), 600 ether);
        assertEq(migrator.claimed(alice), 600 ether);
        assertEq(migrator.claimable(alice), 400 ether);
    }

    function test_migrate_fullAllocation() public {
        migrator.setAllocation(alice, 1000 ether);

        vm.startPrank(alice);
        v1.approve(address(migrator), 1000 ether);
        migrator.migrate(1000 ether);
        vm.stopPrank();

        assertEq(v2.balanceOf(alice), 1000 ether);
        assertEq(migrator.claimable(alice), 0);
    }

    function test_migrate_partialThenRest() public {
        migrator.setAllocation(alice, 1000 ether);

        vm.startPrank(alice);
        v1.approve(address(migrator), 1000 ether);

        migrator.migrate(300 ether);
        assertEq(migrator.claimable(alice), 700 ether);

        migrator.migrate(700 ether);
        assertEq(migrator.claimable(alice), 0);
        assertEq(v2.balanceOf(alice), 1000 ether);
        vm.stopPrank();
    }

    // ─── Reverts ─────────────────────────────────────────

    function test_migrate_notWhitelisted() public {
        vm.startPrank(eve);
        vm.expectRevert(SigilMigrator.NotWhitelisted.selector);
        migrator.migrate(100 ether);
        vm.stopPrank();
    }

    function test_migrate_exceedsAllocation() public {
        migrator.setAllocation(alice, 500 ether);

        vm.startPrank(alice);
        v1.approve(address(migrator), 1000 ether);
        vm.expectRevert(SigilMigrator.ExceedsAllocation.selector);
        migrator.migrate(501 ether);
        vm.stopPrank();
    }

    function test_migrate_zeroAmount() public {
        migrator.setAllocation(alice, 1000 ether);

        vm.startPrank(alice);
        vm.expectRevert(SigilMigrator.ZeroAmount.selector);
        migrator.migrate(0);
        vm.stopPrank();
    }

    function test_migrate_whenPaused() public {
        migrator.setAllocation(alice, 1000 ether);
        migrator.pause();

        vm.startPrank(alice);
        v1.approve(address(migrator), 100 ether);
        vm.expectRevert(SigilMigrator.IsPaused.selector);
        migrator.migrate(100 ether);
        vm.stopPrank();
    }

    function test_migrate_afterUnpause() public {
        migrator.setAllocation(alice, 1000 ether);

        migrator.pause();
        migrator.unpause();

        vm.startPrank(alice);
        v1.approve(address(migrator), 100 ether);
        migrator.migrate(100 ether);
        vm.stopPrank();

        assertEq(v2.balanceOf(alice), 100 ether);
    }

    // ─── Batch Allocations ───────────────────────────────

    function test_setAllocations_batch() public {
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 ether;
        amounts[1] = 500 ether;

        migrator.setAllocations(users, amounts);

        assertEq(migrator.allocation(alice), 1000 ether);
        assertEq(migrator.allocation(bob), 500 ether);
    }

    function test_setAllocations_lengthMismatch() public {
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000 ether;

        vm.expectRevert(SigilMigrator.LengthMismatch.selector);
        migrator.setAllocations(users, amounts);
    }

    // ─── Withdraw V2 ─────────────────────────────────────

    function test_withdrawV2() public {
        uint256 before = v2.balanceOf(owner);
        migrator.withdrawV2(500 ether, owner);
        assertEq(v2.balanceOf(owner), before + 500 ether);
    }

    function test_withdrawV2_toCustomAddress() public {
        migrator.withdrawV2(100 ether, eve);
        assertEq(v2.balanceOf(eve), 100 ether);
    }

    function test_withdrawV2_whilePaused() public {
        // Should work even when paused
        migrator.pause();
        uint256 before = v2.balanceOf(owner);
        migrator.withdrawV2(500 ether, owner);
        assertEq(v2.balanceOf(owner), before + 500 ether);
    }

    function test_withdrawV2_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(SigilMigrator.OnlyOwner.selector);
        migrator.withdrawV2(100 ether, alice);
    }

    // ─── Withdraw V1 ─────────────────────────────────────

    function test_withdrawV1() public {
        // First, get some V1 into the migrator via a migration
        migrator.setAllocation(alice, 1000 ether);

        vm.startPrank(alice);
        v1.approve(address(migrator), 200 ether);
        migrator.migrate(200 ether);
        vm.stopPrank();

        // Owner withdraws the received V1
        uint256 before = v1.balanceOf(owner);
        migrator.withdrawV1(200 ether, owner);
        assertEq(v1.balanceOf(owner), before + 200 ether);
    }

    function test_withdrawV1_whilePaused() public {
        migrator.setAllocation(alice, 1000 ether);

        vm.startPrank(alice);
        v1.approve(address(migrator), 200 ether);
        migrator.migrate(200 ether);
        vm.stopPrank();

        // Should work even when paused
        migrator.pause();
        uint256 before = v1.balanceOf(owner);
        migrator.withdrawV1(200 ether, owner);
        assertEq(v1.balanceOf(owner), before + 200 ether);
    }

    function test_withdrawV1_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(SigilMigrator.OnlyOwner.selector);
        migrator.withdrawV1(100 ether, alice);
    }

    // ─── Access Control ──────────────────────────────────

    function test_setAllocation_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(SigilMigrator.OnlyOwner.selector);
        migrator.setAllocation(alice, 1000 ether);
    }

    function test_pause_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(SigilMigrator.OnlyOwner.selector);
        migrator.pause();
    }

    function test_transferOwnership_twoStep() public {
        // Step 1: current owner starts transfer
        migrator.transferOwnership(alice);

        // Owner hasn't changed yet
        assertEq(migrator.owner(), owner);
        assertEq(migrator.pendingOwner(), alice);

        // Old owner can still call admin functions
        migrator.pause();
        migrator.unpause();

        // Step 2: pending owner accepts
        vm.prank(alice);
        migrator.acceptOwnership();

        assertEq(migrator.owner(), alice);
        assertEq(migrator.pendingOwner(), address(0));

        // Old owner can no longer call admin
        vm.expectRevert(SigilMigrator.OnlyOwner.selector);
        migrator.pause();

        // New owner can
        vm.prank(alice);
        migrator.pause();
        assertTrue(migrator.paused());
    }

    function test_acceptOwnership_notPending() public {
        migrator.transferOwnership(alice);

        // Bob tries to accept — should revert
        vm.prank(bob);
        vm.expectRevert(SigilMigrator.NotPendingOwner.selector);
        migrator.acceptOwnership();
    }

    // ─── View ────────────────────────────────────────────

    function test_claimable_noAllocation() public view {
        assertEq(migrator.claimable(eve), 0);
    }

    function test_claimable_afterPartialClaim() public {
        migrator.setAllocation(alice, 1000 ether);

        vm.startPrank(alice);
        v1.approve(address(migrator), 400 ether);
        migrator.migrate(400 ether);
        vm.stopPrank();

        assertEq(migrator.claimable(alice), 600 ether);
    }
}
