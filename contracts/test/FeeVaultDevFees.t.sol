// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/SigilFeeVault.sol";

/// @dev Minimal ERC20 mock for testing
contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
}

contract FeeVaultDevFeesTest is Test {
    SigilFeeVault vault;
    MockUSDC usdc;
    
    address dev = address(0xDEAD);
    address depositor = address(0xBEEF);
    address treasury = address(0xCAFE);
    bytes32 poolId = keccak256("TEST_POOL");

    function setUp() public {
        usdc = new MockUSDC();
        vault = new SigilFeeVault(treasury);
        vault.setAuthorizedDepositor(depositor);
    }

    function test_depositFees_creditsDevFees() public {
        uint256 devAmount = 80e6;   // 80 USDC
        uint256 protoAmount = 20e6; // 20 USDC
        uint256 total = devAmount + protoAmount;

        // Mint USDC to depositor and approve vault
        usdc.mint(depositor, total);
        vm.prank(depositor);
        usdc.approve(address(vault), total);

        // BEFORE
        uint256 devFeesBefore = vault.devFees(dev, address(usdc));
        uint256 totalEarnedBefore = vault.totalDevFeesEarned(dev, address(usdc));
        uint256 protoFeesBefore = vault.protocolFees(address(usdc));

        // Deposit fees
        vm.prank(depositor);
        vault.depositFees(poolId, dev, address(usdc), devAmount, protoAmount);

        // AFTER
        uint256 devFeesAfter = vault.devFees(dev, address(usdc));
        uint256 totalEarnedAfter = vault.totalDevFeesEarned(dev, address(usdc));
        uint256 protoFeesAfter = vault.protocolFees(address(usdc));

        // Critical assertions
        assertEq(protoFeesAfter - protoFeesBefore, protoAmount, "protocolFees not credited");
        assertEq(devFeesAfter - devFeesBefore, devAmount, "devFees NOT CREDITED - THIS IS THE BUG");
        assertEq(totalEarnedAfter - totalEarnedBefore, devAmount, "totalDevFeesEarned NOT CREDITED - THIS IS THE BUG");

        // Verify vault received the USDC
        assertEq(usdc.balanceOf(address(vault)), total, "vault did not receive USDC");
    }

    function test_depositFees_escrowsWhenDevIsZero() public {
        uint256 devAmount = 80e6;
        uint256 protoAmount = 20e6;
        uint256 total = devAmount + protoAmount;

        usdc.mint(depositor, total);
        vm.prank(depositor);
        usdc.approve(address(vault), total);

        // Deposit with dev = address(0) — should escrow
        vm.prank(depositor);
        vault.depositFees(poolId, address(0), address(usdc), devAmount, protoAmount);

        // Protocol should be credited
        assertEq(vault.protocolFees(address(usdc)), protoAmount, "protocolFees not credited");

        // Dev fees should NOT be credited (dev is zero)
        assertEq(vault.devFees(address(0), address(usdc)), 0, "devFees should be 0 for zero dev");

        // Escrow should have the amount
        assertEq(vault.unclaimedFees(poolId, address(usdc)), devAmount, "escrow not credited");
    }

    function test_claimDevFees_afterDeposit() public {
        uint256 devAmount = 80e6;
        uint256 protoAmount = 20e6;

        usdc.mint(depositor, devAmount + protoAmount);
        vm.prank(depositor);
        usdc.approve(address(vault), devAmount + protoAmount);

        vm.prank(depositor);
        vault.depositFees(poolId, dev, address(usdc), devAmount, protoAmount);

        // Dev should have claimable balance
        assertEq(vault.devFees(dev, address(usdc)), devAmount, "devFees should be 80 USDC");

        // Claim
        vm.prank(dev);
        vault.claimDevFees(address(usdc));

        // After claim
        assertEq(vault.devFees(dev, address(usdc)), 0, "devFees should be 0 after claim");
        assertEq(usdc.balanceOf(dev), devAmount, "dev should have received 80 USDC");
    }
}
