// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/SigilFeeVault.sol";

/// @notice Test against DEPLOYED V1 FeeVault on mainnet fork
contract FeeVaultV1ForkTest is Test {
    address constant VAULT_V1 = 0xc7A27840141C7e89cb39d58BED0E75689bb6f933;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant LOCKER_V1 = 0x2fFffA6519cFFB738c0f017252384A8c5B18219F;

    address dev = 0xfcF2d394aA19602698174E608c3a66825502ad0e;

    function test_v1_deployedVault_depositFees() public {
        SigilFeeVault vault = SigilFeeVault(payable(VAULT_V1));

        // Get the authorized depositor
        address depositor = vault.authorizedDepositor();
        emit log_named_address("V1 authorized depositor", depositor);
        assertEq(depositor, LOCKER_V1, "depositor should be V1 locker");

        // Give depositor USDC
        deal(USDC, depositor, 1000e6);

        // Approve
        vm.prank(depositor);
        (bool ok,) = USDC.call(abi.encodeWithSignature("approve(address,uint256)", VAULT_V1, 100e6));
        require(ok, "approve failed");

        // Check BEFORE
        uint256 devBefore = vault.devFees(dev, USDC);
        uint256 totalBefore = vault.totalDevFeesEarned(dev, USDC);
        uint256 protoBefore = vault.protocolFees(USDC);

        emit log_named_uint("devFees BEFORE", devBefore);
        emit log_named_uint("totalEarned BEFORE", totalBefore);
        emit log_named_uint("protocolFees BEFORE", protoBefore);

        // Call depositFees directly on V1 vault
        bytes32 poolId = keccak256("TESTPOOL");
        vm.prank(depositor);
        vault.depositFees(poolId, dev, USDC, 80e6, 20e6);

        // Check AFTER
        uint256 devAfter = vault.devFees(dev, USDC);
        uint256 totalAfter = vault.totalDevFeesEarned(dev, USDC);
        uint256 protoAfter = vault.protocolFees(USDC);

        emit log_named_uint("devFees AFTER", devAfter);
        emit log_named_uint("totalEarned AFTER", totalAfter);
        emit log_named_uint("protocolFees AFTER", protoAfter);

        // Assert protocol fees work
        assertEq(protoAfter - protoBefore, 20e6, "protocolFees delta wrong");

        // THE CRITICAL CHECK: does the V1 deployed vault credit devFees?
        assertEq(devAfter - devBefore, 80e6, "V1 devFees NOT CREDITED!");
        assertEq(totalAfter - totalBefore, 80e6, "V1 totalDevFeesEarned NOT CREDITED!");
    }

    function test_v1_collectFees_endToEnd() public {
        // Test the full flow: call collectFees on V1 locker, check V1 vault state
        SigilFeeVault vault = SigilFeeVault(payable(VAULT_V1));

        uint256 devBefore = vault.devFees(dev, USDC);
        uint256 totalBefore = vault.totalDevFeesEarned(dev, USDC);
        uint256 protoBefore = vault.protocolFees(USDC);

        emit log_named_uint("devFees BEFORE", devBefore);
        emit log_named_uint("totalEarned BEFORE", totalBefore);

        // Call collectFees(4659103) — HeySigil position
        vm.prank(address(this));
        (bool ok, bytes memory ret) = LOCKER_V1.call(
            abi.encodeWithSignature("collectFees(uint256)", 4659103)
        );
        emit log_named_string("collectFees success", ok ? "true" : "false");

        if (ok) {
            uint256 devAfter = vault.devFees(dev, USDC);
            uint256 totalAfter = vault.totalDevFeesEarned(dev, USDC);
            uint256 protoAfter = vault.protocolFees(USDC);

            emit log_named_uint("devFees AFTER", devAfter);
            emit log_named_uint("totalEarned AFTER", totalAfter);
            emit log_named_uint("protocolFees delta", protoAfter - protoBefore);
            emit log_named_uint("devFees delta", devAfter - devBefore);
        }
    }
}
