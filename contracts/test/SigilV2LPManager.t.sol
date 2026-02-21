// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {SigilV2LPManager} from "../src/SigilV2LPManager.sol";

// ─── Mock Contracts ─────────────────────────────────────

/// @dev Minimal mock of NonfungiblePositionManager for unit tests.
contract MockPositionManager {
    struct MockPosition {
        address token0;
        address token1;
        address ownerAddr;
    }

    mapping(uint256 => MockPosition) internal _positions;
    mapping(uint256 => uint256) public fee0; // tokenId → accrued fee0
    mapping(uint256 => uint256) public fee1; // tokenId → accrued fee1

    uint256 public nextTokenId = 1;

    // Mint a mock position and return it
    function mintMock(address token0, address token1, address to)
        external
        returns (uint256 tokenId)
    {
        tokenId = nextTokenId++;
        _positions[tokenId] = MockPosition(token0, token1, to);
    }

    // Set accrued fees for testing
    function setFees(uint256 tokenId, uint256 amount0, uint256 amount1) external {
        fee0[tokenId] = amount0;
        fee1[tokenId] = amount1;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        return _positions[tokenId].ownerAddr;
    }

    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96, address, address, address, uint24,
            int24, int24, uint128, uint256, uint256, uint128, uint128
        )
    {
        MockPosition storage p = _positions[tokenId];
        return (0, address(0), p.token0, p.token1, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function collect(CollectParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1)
    {
        // Return and reset accrued fees
        amount0 = fee0[params.tokenId];
        amount1 = fee1[params.tokenId];
        fee0[params.tokenId] = 0;
        fee1[params.tokenId] = 0;

        // Send tokens to recipient if there are fees
        if (amount0 > 0) {
            MockERC20(_positions[params.tokenId].token0).mockTransfer(params.recipient, amount0);
        }
        if (amount1 > 0) {
            MockERC20(_positions[params.tokenId].token1).mockTransfer(params.recipient, amount1);
        }
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_positions[tokenId].ownerAddr == from, "NOT_OWNER");
        _positions[tokenId].ownerAddr = to;
    }
}

/// @dev Minimal mock ERC20 for fee testing.
contract MockERC20 {
    string public name;
    mapping(address => uint256) public balanceOf;

    constructor(string memory _name) {
        name = _name;
    }

    function mockMint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function mockTransfer(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}

// ─── Tests ──────────────────────────────────────────────

contract SigilV2LPManagerTest is Test {
    SigilV2LPManager manager;
    MockPositionManager pm;
    MockERC20 tokenA;
    MockERC20 tokenB;

    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address v2Token = address(0xDEAD);

    uint256 nft1;
    uint256 nft2;
    uint256 nft3;

    function setUp() public {
        // Deploy mocks
        tokenA = new MockERC20("TokenA");
        tokenB = new MockERC20("TokenB");
        pm = new MockPositionManager();

        // Use tokenA as the V2 token for pair validation
        v2Token = address(tokenA);

        // Deploy manager
        manager = new SigilV2LPManager(address(pm), v2Token);

        // Mint mock NFTs owned by the manager
        nft1 = pm.mintMock(address(tokenA), address(tokenB), address(manager));
        nft2 = pm.mintMock(address(tokenA), address(tokenB), address(manager));
        nft3 = pm.mintMock(address(tokenA), address(tokenB), address(manager));
    }

    // ─── Registration ────────────────────────────────────

    function test_registerPosition_happyPath() public {
        manager.registerPosition(nft1);

        assertEq(manager.getPositionCount(), 1);
        assertTrue(manager.isActive(nft1));
    }

    function test_registerPosition_multiple() public {
        manager.registerPosition(nft1);
        manager.registerPosition(nft2);
        manager.registerPosition(nft3);

        assertEq(manager.getPositionCount(), 3);
        assertTrue(manager.isActive(nft1));
        assertTrue(manager.isActive(nft2));
        assertTrue(manager.isActive(nft3));
    }

    function test_registerPosition_already_reverts() public {
        manager.registerPosition(nft1);

        vm.expectRevert(SigilV2LPManager.AlreadyRegistered.selector);
        manager.registerPosition(nft1);
    }

    function test_registerPosition_notOwned_reverts() public {
        // Mint an NFT owned by someone else
        uint256 foreignNft = pm.mintMock(address(tokenA), address(tokenB), alice);

        vm.expectRevert(SigilV2LPManager.NftNotOwned.selector);
        manager.registerPosition(foreignNft);
    }

    function test_registerPosition_wrongPair_reverts() public {
        // Mint an NFT for an unrelated pair (neither token is v2Token)
        MockERC20 tokenC = new MockERC20("TokenC");
        MockERC20 tokenD = new MockERC20("TokenD");
        uint256 wrongNft = pm.mintMock(address(tokenC), address(tokenD), address(manager));

        vm.expectRevert(SigilV2LPManager.NotExpectedPair.selector);
        manager.registerPosition(wrongNft);
    }

    function test_registerPosition_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(SigilV2LPManager.OnlyOwner.selector);
        manager.registerPosition(nft1);
    }

    // ─── Emergency Withdraw ─────────────────────────────

    function test_emergencyWithdraw_happyPath() public {
        manager.registerPosition(nft1);
        manager.registerPosition(nft2);

        manager.emergencyWithdraw(nft1, alice);

        // NFT transferred
        assertEq(pm.ownerOf(nft1), alice);
        // Removed from tracking
        assertFalse(manager.isActive(nft1));
        assertEq(manager.getPositionCount(), 1);
        // Other position unaffected
        assertTrue(manager.isActive(nft2));
    }

    function test_emergencyWithdraw_allPositions() public {
        manager.registerPosition(nft1);
        manager.registerPosition(nft2);
        manager.registerPosition(nft3);

        manager.emergencyWithdraw(nft1, alice);
        manager.emergencyWithdraw(nft2, alice);
        manager.emergencyWithdraw(nft3, alice);

        assertEq(manager.getPositionCount(), 0);
        assertEq(pm.ownerOf(nft1), alice);
        assertEq(pm.ownerOf(nft2), alice);
        assertEq(pm.ownerOf(nft3), alice);
    }

    function test_emergencyWithdraw_notActive_reverts() public {
        vm.expectRevert(SigilV2LPManager.PositionNotActive.selector);
        manager.emergencyWithdraw(nft1, alice);
    }

    function test_emergencyWithdraw_zeroAddress_reverts() public {
        manager.registerPosition(nft1);

        vm.expectRevert(SigilV2LPManager.ZeroAddress.selector);
        manager.emergencyWithdraw(nft1, address(0));
    }

    function test_emergencyWithdraw_onlyOwner() public {
        manager.registerPosition(nft1);

        vm.prank(alice);
        vm.expectRevert(SigilV2LPManager.OnlyOwner.selector);
        manager.emergencyWithdraw(nft1, alice);
    }

    function test_emergencyWithdraw_whilePaused() public {
        manager.registerPosition(nft1);
        manager.pause();

        // Should still work when paused
        manager.emergencyWithdraw(nft1, alice);
        assertEq(pm.ownerOf(nft1), alice);
    }

    // ─── Sweep Fees (all) ───────────────────────────────

    function test_sweepFees_all_happyPath() public {
        manager.registerPosition(nft1);
        manager.registerPosition(nft2);

        // Set accrued fees
        pm.setFees(nft1, 100 ether, 50 ether);
        pm.setFees(nft2, 200 ether, 75 ether);

        manager.sweepFees();

        // Owner should receive all fees
        assertEq(tokenA.balanceOf(owner), 300 ether);
        assertEq(tokenB.balanceOf(owner), 125 ether);
    }

    function test_sweepFees_all_noFees() public {
        manager.registerPosition(nft1);

        // No fees accrued — should not revert
        manager.sweepFees();

        assertEq(tokenA.balanceOf(owner), 0);
    }

    function test_sweepFees_all_paused_reverts() public {
        manager.registerPosition(nft1);
        manager.pause();

        vm.expectRevert(SigilV2LPManager.ContractPaused.selector);
        manager.sweepFees();
    }

    // ─── Sweep Fees (single) ────────────────────────────

    function test_sweepFees_single_happyPath() public {
        manager.registerPosition(nft1);
        manager.registerPosition(nft2);

        pm.setFees(nft1, 100 ether, 50 ether);
        pm.setFees(nft2, 200 ether, 75 ether);

        // Sweep only nft1
        manager.sweepFees(nft1);

        assertEq(tokenA.balanceOf(owner), 100 ether);
        assertEq(tokenB.balanceOf(owner), 50 ether);
    }

    function test_sweepFees_single_notActive_reverts() public {
        vm.expectRevert(SigilV2LPManager.PositionNotActive.selector);
        manager.sweepFees(nft1);
    }

    function test_sweepFees_single_paused_reverts() public {
        manager.registerPosition(nft1);
        manager.pause();

        vm.expectRevert(SigilV2LPManager.ContractPaused.selector);
        manager.sweepFees(nft1);
    }

    // ─── Pause / Unpause ────────────────────────────────

    function test_pause_unpause() public {
        manager.pause();
        assertTrue(manager.paused());

        manager.unpause();
        assertFalse(manager.paused());
    }

    function test_pause_alreadyPaused_reverts() public {
        manager.pause();

        vm.expectRevert(SigilV2LPManager.ContractPaused.selector);
        manager.pause();
    }

    function test_unpause_notPaused_reverts() public {
        vm.expectRevert(SigilV2LPManager.ContractNotPaused.selector);
        manager.unpause();
    }

    function test_pause_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(SigilV2LPManager.OnlyOwner.selector);
        manager.pause();
    }

    // ─── Ownership (2-step) ─────────────────────────────

    function test_transferOwnership_twoStep() public {
        manager.transferOwnership(alice);

        // Owner hasn't changed yet
        assertEq(manager.owner(), owner);
        assertEq(manager.pendingOwner(), alice);

        // Old owner can still admin
        manager.pause();
        manager.unpause();

        // Pending owner accepts
        vm.prank(alice);
        manager.acceptOwnership();

        assertEq(manager.owner(), alice);
        assertEq(manager.pendingOwner(), address(0));

        // Old owner can no longer admin
        vm.expectRevert(SigilV2LPManager.OnlyOwner.selector);
        manager.pause();

        // New owner can
        vm.prank(alice);
        manager.pause();
        assertTrue(manager.paused());
    }

    function test_acceptOwnership_notPending_reverts() public {
        manager.transferOwnership(alice);

        vm.prank(bob);
        vm.expectRevert(SigilV2LPManager.OnlyPendingOwner.selector);
        manager.acceptOwnership();
    }

    function test_transferOwnership_zeroAddress_reverts() public {
        vm.expectRevert(SigilV2LPManager.ZeroAddress.selector);
        manager.transferOwnership(address(0));
    }

    // ─── Fees go to new owner after transfer ────────────

    function test_sweepFees_goesToNewOwner() public {
        manager.registerPosition(nft1);
        pm.setFees(nft1, 100 ether, 50 ether);

        // Transfer ownership
        manager.transferOwnership(alice);
        vm.prank(alice);
        manager.acceptOwnership();

        // Sweep as alice
        vm.prank(alice);
        manager.sweepFees();

        // Fees should go to alice (new owner), not original owner
        assertEq(tokenA.balanceOf(alice), 100 ether);
        assertEq(tokenA.balanceOf(owner), 0);
    }

    // ─── Views ──────────────────────────────────────────

    function test_getAllPositionIds() public {
        manager.registerPosition(nft1);
        manager.registerPosition(nft2);

        uint256[] memory ids = manager.getAllPositionIds();
        assertEq(ids.length, 2);
        assertEq(ids[0], nft1);
        assertEq(ids[1], nft2);
    }

    function test_isActive_unregistered() public view {
        assertFalse(manager.isActive(999));
    }

    // ─── ERC721 Receiver ────────────────────────────────

    function test_onERC721Received() public view {
        bytes4 selector = manager.onERC721Received(address(0), address(0), 0, "");
        assertEq(selector, bytes4(keccak256("onERC721Received(address,address,uint256,bytes)")));
    }

    // ─── Constructor Edge Cases ─────────────────────────

    function test_constructor_zeroPositionManager_reverts() public {
        vm.expectRevert(SigilV2LPManager.ZeroAddress.selector);
        new SigilV2LPManager(address(0), v2Token);
    }

    function test_constructor_zeroV2Token_reverts() public {
        vm.expectRevert(SigilV2LPManager.ZeroAddress.selector);
        new SigilV2LPManager(address(pm), address(0));
    }
}
