// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/SigilFeeVault.sol";

/// @notice Tests devFees routing on a Base mainnet fork with real USDC
contract FeeVaultMainnetForkTest is Test {
    SigilFeeVault vault;

    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address dev = address(0xDEAD);
    address depositor = address(0xBEEF);
    address treasury = address(0xCAFE);
    bytes32 poolId = keccak256("TEST_POOL");

    function setUp() public {
        // Deploy fresh vault
        vault = new SigilFeeVault(treasury);
        vault.setAuthorizedDepositor(depositor);

        // Give depositor USDC via deal (mainnet fork cheat)
        deal(USDC, depositor, 1000e6);
    }

    function test_fork_depositFees_creditsDevFees() public {
        uint256 devAmount = 80e6;
        uint256 protoAmount = 20e6;
        uint256 total = devAmount + protoAmount;

        // Approve vault
        vm.prank(depositor);
        (bool ok,) = USDC.call(abi.encodeWithSignature("approve(address,uint256)", address(vault), total));
        require(ok, "approve failed");

        // Deposit
        vm.prank(depositor);
        vault.depositFees(poolId, dev, USDC, devAmount, protoAmount);

        // Check all balances
        uint256 proto = vault.protocolFees(USDC);
        uint256 devFees = vault.devFees(dev, USDC);
        uint256 totalEarned = vault.totalDevFeesEarned(dev, USDC);

        emit log_named_uint("protocolFees", proto);
        emit log_named_uint("devFees", devFees);
        emit log_named_uint("totalDevFeesEarned", totalEarned);

        assertEq(proto, protoAmount, "protocolFees wrong");
        assertEq(devFees, devAmount, "devFees NOT CREDITED - BUG!");
        assertEq(totalEarned, devAmount, "totalDevFeesEarned NOT CREDITED - BUG!");
    }

    function test_fork_depositFees_escrows() public {
        uint256 devAmount = 80e6;
        uint256 protoAmount = 20e6;

        vm.prank(depositor);
        (bool ok,) = USDC.call(abi.encodeWithSignature("approve(address,uint256)", address(vault), devAmount + protoAmount));
        require(ok, "approve failed");

        vm.prank(depositor);
        vault.depositFees(poolId, address(0), USDC, devAmount, protoAmount);

        uint256 proto = vault.protocolFees(USDC);
        uint256 escrowed = vault.unclaimedFees(poolId, USDC);

        emit log_named_uint("protocolFees", proto);
        emit log_named_uint("escrowed", escrowed);

        assertEq(proto, protoAmount, "protocolFees wrong");
        assertEq(escrowed, devAmount, "escrow NOT CREDITED - BUG!");
    }

    function test_fork_existingV2Vault_devFees() public {
        // Test against the ACTUAL deployed V2 FeeVault
        SigilFeeVault v2vault = SigilFeeVault(payable(0x2BD1407148436827E74674222DD0d772c6C885C5));

        // Get the authorized depositor (V2 LP Locker)
        address authDepositor = v2vault.authorizedDepositor();
        emit log_named_address("V2 authorized depositor", authDepositor);

        // Give depositor USDC
        deal(USDC, authDepositor, 1000e6);

        // Approve vault from the authorized depositor
        vm.prank(authDepositor);
        (bool ok,) = USDC.call(abi.encodeWithSignature("approve(address,uint256)", address(v2vault), 100e6));
        require(ok, "approve failed");

        // Check devFees before
        uint256 devBefore = v2vault.devFees(dev, USDC);
        uint256 totalBefore = v2vault.totalDevFeesEarned(dev, USDC);
        uint256 protoBefore = v2vault.protocolFees(USDC);

        emit log_named_uint("devFees BEFORE", devBefore);
        emit log_named_uint("totalEarned BEFORE", totalBefore);
        emit log_named_uint("protocolFees BEFORE", protoBefore);

        // Call depositFees on the ACTUAL deployed V2 vault
        vm.prank(authDepositor);
        v2vault.depositFees(poolId, dev, USDC, 80e6, 20e6);

        // Check after
        uint256 devAfter = v2vault.devFees(dev, USDC);
        uint256 totalAfter = v2vault.totalDevFeesEarned(dev, USDC);
        uint256 protoAfter = v2vault.protocolFees(USDC);

        emit log_named_uint("devFees AFTER", devAfter);
        emit log_named_uint("totalEarned AFTER", totalAfter);
        emit log_named_uint("protocolFees AFTER", protoAfter);

        assertEq(protoAfter - protoBefore, 20e6, "protocolFees delta wrong");
        assertEq(devAfter - devBefore, 80e6, "devFees NOT CREDITED on deployed V2 - SAME BUG!");
        assertEq(totalAfter - totalBefore, 80e6, "totalDevFeesEarned NOT CREDITED on deployed V2 - SAME BUG!");
    }
}
