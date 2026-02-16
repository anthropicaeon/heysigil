// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {PoolReward} from "../src/PoolReward.sol";
import {SigilToken} from "../src/SigilToken.sol";
import {MockEAS} from "./mocks/MockEAS.sol";
import {Attestation} from "../src/interfaces/IEAS.sol";

/// @title PoolRewardTest
/// @notice Comprehensive tests for the PoolReward contract.
///
///         Covers:
///         - Pool creation & top-up
///         - Attestation-based reward claiming (all revert paths)
///         - Emergency withdraw
///         - View functions
contract PoolRewardTest is Test {
    MockEAS mockEAS;
    PoolReward poolReward;
    SigilToken rewardToken;

    // Test accounts
    address deployer = address(0xD1);
    address trustedAttester = address(0xA1);
    address dev = address(0xD2);
    address funder = address(0xF1);
    address randomUser = address(0xB0B);

    // Constants
    bytes32 SCHEMA_UID = keccak256("sigil-pool-claim-schema-v1");
    string PROJECT_ID = "github.com/org/repo";
    bytes32 ATTESTATION_UID = keccak256("attestation-1");
    uint256 POOL_AMOUNT = 1_000_000 ether;
    uint256 TOKEN_SUPPLY = 1_000_000_000 ether;

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy mock EAS
        mockEAS = new MockEAS();

        // Deploy PoolReward with mock EAS
        poolReward = new PoolReward(address(mockEAS), trustedAttester, SCHEMA_UID);

        // Deploy a reward token — funder gets all supply
        vm.stopPrank();

        vm.startPrank(funder);
        rewardToken = new SigilToken("Reward Token", "RWD", TOKEN_SUPPLY, funder);
        rewardToken.approve(address(poolReward), type(uint256).max);
        vm.stopPrank();
    }

    // ─── Helpers ─────────────────────────────────────────

    /// @dev Create a pool with default params
    function _createDefaultPool() internal {
        vm.prank(funder);
        poolReward.createPool(PROJECT_ID, address(rewardToken), POOL_AMOUNT);
    }

    /// @dev Configure a valid attestation in the mock EAS
    function _setValidAttestation() internal {
        mockEAS.setSigilAttestation(
            ATTESTATION_UID,
            trustedAttester,
            dev,
            SCHEMA_UID,
            "github",
            PROJECT_ID,
            dev,
            true
        );
    }

    // ═══════════════════════════════════════════════════════
    //                   POOL CREATION
    // ═══════════════════════════════════════════════════════

    function test_createPool() public {
        vm.prank(funder);

        vm.expectEmit(true, false, false, true);
        bytes32 expectedHash = keccak256(abi.encodePacked(PROJECT_ID));
        emit PoolReward.PoolCreated(expectedHash, PROJECT_ID, address(rewardToken), POOL_AMOUNT);

        poolReward.createPool(PROJECT_ID, address(rewardToken), POOL_AMOUNT);

        // Verify pool state
        (address token, uint256 balance, bool claimed, address claimedBy) = poolReward.getPool(PROJECT_ID);
        assertEq(token, address(rewardToken), "Pool token mismatch");
        assertEq(balance, POOL_AMOUNT, "Pool balance mismatch");
        assertFalse(claimed, "Pool should not be claimed");
        assertEq(claimedBy, address(0), "claimedBy should be zero");

        // Verify tokens transferred
        assertEq(rewardToken.balanceOf(address(poolReward)), POOL_AMOUNT, "Contract should hold tokens");
        assertEq(rewardToken.balanceOf(funder), TOKEN_SUPPLY - POOL_AMOUNT, "Funder balance should decrease");
    }

    function test_createPool_addToExisting() public {
        // Create pool twice for the same project — second call adds to balance
        vm.startPrank(funder);
        poolReward.createPool(PROJECT_ID, address(rewardToken), POOL_AMOUNT);
        poolReward.createPool(PROJECT_ID, address(rewardToken), POOL_AMOUNT);
        vm.stopPrank();

        (, uint256 balance,,) = poolReward.getPool(PROJECT_ID);
        assertEq(balance, POOL_AMOUNT * 2, "Balance should be doubled");
    }

    function test_createPool_anyoneCanFund() public {
        // Give randomUser some tokens
        vm.prank(funder);
        rewardToken.transfer(randomUser, POOL_AMOUNT);

        // randomUser creates a pool
        vm.startPrank(randomUser);
        rewardToken.approve(address(poolReward), POOL_AMOUNT);
        poolReward.createPool(PROJECT_ID, address(rewardToken), POOL_AMOUNT);
        vm.stopPrank();

        (, uint256 balance,,) = poolReward.getPool(PROJECT_ID);
        assertEq(balance, POOL_AMOUNT);
    }

    // ═══════════════════════════════════════════════════════
    //                   POOL TOP-UP
    // ═══════════════════════════════════════════════════════

    function test_topUpPool() public {
        _createDefaultPool();

        uint256 topUpAmount = 500_000 ether;
        vm.prank(funder);
        poolReward.topUpPool(PROJECT_ID, topUpAmount);

        (, uint256 balance,,) = poolReward.getPool(PROJECT_ID);
        assertEq(balance, POOL_AMOUNT + topUpAmount, "Balance should include top-up");
    }

    function test_topUpPool_emitsEvent() public {
        _createDefaultPool();

        uint256 topUpAmount = 500_000 ether;
        bytes32 expectedHash = keccak256(abi.encodePacked(PROJECT_ID));

        vm.expectEmit(true, false, false, true);
        emit PoolReward.PoolToppedUp(expectedHash, topUpAmount);

        vm.prank(funder);
        poolReward.topUpPool(PROJECT_ID, topUpAmount);
    }

    function test_topUpPool_revertPoolNotFound() public {
        vm.prank(funder);
        vm.expectRevert(PoolReward.PoolNotFound.selector);
        poolReward.topUpPool("nonexistent/project", 100);
    }

    // ═══════════════════════════════════════════════════════
    //                  CLAIM REWARD - HAPPY PATH
    // ═══════════════════════════════════════════════════════

    function test_claimReward() public {
        _createDefaultPool();
        _setValidAttestation();

        bytes32 expectedHash = keccak256(abi.encodePacked(PROJECT_ID));

        vm.expectEmit(true, true, false, true);
        emit PoolReward.RewardClaimed(expectedHash, dev, address(rewardToken), POOL_AMOUNT, ATTESTATION_UID);

        vm.prank(dev);
        poolReward.claimReward(ATTESTATION_UID);

        // Verify tokens transferred to dev
        assertEq(rewardToken.balanceOf(dev), POOL_AMOUNT, "Dev should receive pool tokens");
        assertEq(rewardToken.balanceOf(address(poolReward)), 0, "Contract should have zero balance");

        // Verify pool marked as claimed
        (, uint256 balance, bool claimed, address claimedBy) = poolReward.getPool(PROJECT_ID);
        assertEq(balance, 0, "Pool balance should be zero");
        assertTrue(claimed, "Pool should be marked claimed");
        assertEq(claimedBy, dev, "claimedBy should be dev");
    }

    // ═══════════════════════════════════════════════════════
    //              CLAIM REWARD - REVERT PATHS
    // ═══════════════════════════════════════════════════════

    function test_claimReward_revertUntrustedAttester() public {
        _createDefaultPool();

        // Set attestation with WRONG attester
        address wrongAttester = address(0xBAD);
        mockEAS.setSigilAttestation(
            ATTESTATION_UID, wrongAttester, dev, SCHEMA_UID,
            "github", PROJECT_ID, dev, true
        );

        vm.prank(dev);
        vm.expectRevert(abi.encodeWithSelector(PoolReward.UntrustedAttester.selector, wrongAttester));
        poolReward.claimReward(ATTESTATION_UID);
    }

    function test_claimReward_revertNotRecipient() public {
        _createDefaultPool();

        // Set attestation where recipient is someone else
        address otherRecipient = address(0xCAFE);
        mockEAS.setSigilAttestation(
            ATTESTATION_UID, trustedAttester, otherRecipient, SCHEMA_UID,
            "github", PROJECT_ID, otherRecipient, true
        );

        // dev tries to claim but they're not the recipient
        vm.prank(dev);
        vm.expectRevert(abi.encodeWithSelector(PoolReward.NotRecipient.selector, otherRecipient, dev));
        poolReward.claimReward(ATTESTATION_UID);
    }

    function test_claimReward_revertRevoked() public {
        _createDefaultPool();
        _setValidAttestation();

        // Revoke the attestation
        mockEAS.revokeAttestation(ATTESTATION_UID);

        vm.prank(dev);
        vm.expectRevert(PoolReward.AttestationRevoked.selector);
        poolReward.claimReward(ATTESTATION_UID);
    }

    function test_claimReward_revertWrongSchema() public {
        _createDefaultPool();

        // Set attestation with wrong schema
        bytes32 wrongSchema = keccak256("wrong-schema");
        mockEAS.setSigilAttestation(
            ATTESTATION_UID, trustedAttester, dev, wrongSchema,
            "github", PROJECT_ID, dev, true
        );

        vm.prank(dev);
        vm.expectRevert(abi.encodeWithSelector(PoolReward.WrongSchema.selector, SCHEMA_UID, wrongSchema));
        poolReward.claimReward(ATTESTATION_UID);
    }

    function test_claimReward_revertNotProjectOwner() public {
        _createDefaultPool();

        // Set attestation where isOwner = false
        mockEAS.setSigilAttestation(
            ATTESTATION_UID, trustedAttester, dev, SCHEMA_UID,
            "github", PROJECT_ID, dev, false  // <-- isOwner = false
        );

        vm.prank(dev);
        vm.expectRevert(PoolReward.NotProjectOwner.selector);
        poolReward.claimReward(ATTESTATION_UID);
    }

    function test_claimReward_revertPoolNotFound() public {
        // Don't create a pool — but set a valid attestation
        _setValidAttestation();

        vm.prank(dev);
        vm.expectRevert(PoolReward.PoolNotFound.selector);
        poolReward.claimReward(ATTESTATION_UID);
    }

    function test_claimReward_revertAlreadyClaimed() public {
        _createDefaultPool();
        _setValidAttestation();

        // First claim succeeds
        vm.prank(dev);
        poolReward.claimReward(ATTESTATION_UID);

        // Set a new attestation UID for a different claim attempt
        bytes32 secondUid = keccak256("attestation-2");
        mockEAS.setSigilAttestation(
            secondUid, trustedAttester, dev, SCHEMA_UID,
            "github", PROJECT_ID, dev, true
        );

        // Second claim reverts
        vm.prank(dev);
        vm.expectRevert(PoolReward.PoolAlreadyClaimed.selector);
        poolReward.claimReward(secondUid);
    }

    // ═══════════════════════════════════════════════════════
    //                   VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════

    function test_getPool_emptyProject() public view {
        (address token, uint256 balance, bool claimed, address claimedBy) = poolReward.getPool("nonexistent");
        assertEq(token, address(0));
        assertEq(balance, 0);
        assertFalse(claimed);
        assertEq(claimedBy, address(0));
    }

    function test_getPool_afterCreation() public {
        _createDefaultPool();

        (address token, uint256 balance, bool claimed, address claimedBy) = poolReward.getPool(PROJECT_ID);
        assertEq(token, address(rewardToken));
        assertEq(balance, POOL_AMOUNT);
        assertFalse(claimed);
        assertEq(claimedBy, address(0));
    }

    function test_getPool_afterClaim() public {
        _createDefaultPool();
        _setValidAttestation();

        vm.prank(dev);
        poolReward.claimReward(ATTESTATION_UID);

        (address token, uint256 balance, bool claimed, address claimedBy) = poolReward.getPool(PROJECT_ID);
        assertEq(token, address(rewardToken));
        assertEq(balance, 0);
        assertTrue(claimed);
        assertEq(claimedBy, dev);
    }

    // ═══════════════════════════════════════════════════════
    //                 EMERGENCY WITHDRAW
    // ═══════════════════════════════════════════════════════

    function test_emergencyWithdraw() public {
        _createDefaultPool();
        address rescueAddr = address(0x999);

        vm.prank(deployer);
        poolReward.emergencyWithdraw(PROJECT_ID, rescueAddr);

        assertEq(rewardToken.balanceOf(rescueAddr), POOL_AMOUNT, "Rescue addr should get tokens");
        assertEq(rewardToken.balanceOf(address(poolReward)), 0, "Contract should be empty");

        // Pool balance zeroed but NOT marked as claimed
        (, uint256 balance, bool claimed,) = poolReward.getPool(PROJECT_ID);
        assertEq(balance, 0);
        assertFalse(claimed, "Emergency withdraw should not mark as claimed");
    }

    function test_emergencyWithdraw_revertOnlyOwner() public {
        _createDefaultPool();

        vm.prank(randomUser);
        vm.expectRevert(PoolReward.OnlyOwner.selector);
        poolReward.emergencyWithdraw(PROJECT_ID, randomUser);
    }

    function test_emergencyWithdraw_revertPoolNotFound() public {
        vm.prank(deployer);
        vm.expectRevert(PoolReward.PoolNotFound.selector);
        poolReward.emergencyWithdraw("nonexistent", deployer);
    }

    function test_emergencyWithdraw_revertAlreadyClaimed() public {
        _createDefaultPool();
        _setValidAttestation();

        // Dev claims first
        vm.prank(dev);
        poolReward.claimReward(ATTESTATION_UID);

        // Owner tries emergency withdraw on claimed pool
        vm.prank(deployer);
        vm.expectRevert(PoolReward.PoolAlreadyClaimed.selector);
        poolReward.emergencyWithdraw(PROJECT_ID, deployer);
    }

    // ═══════════════════════════════════════════════════════
    //                  CONSTRUCTOR
    // ═══════════════════════════════════════════════════════

    function test_constructor() public view {
        assertEq(address(poolReward.eas()), address(mockEAS));
        assertEq(poolReward.trustedAttester(), trustedAttester);
        assertEq(poolReward.schemaUid(), SCHEMA_UID);
        assertEq(poolReward.owner(), deployer);
    }
}
