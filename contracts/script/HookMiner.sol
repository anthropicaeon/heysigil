// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title HookMiner
/// @notice Utility to mine CREATE2 salt values that produce hook addresses
///         encoding the correct Uniswap V4 permission flags.
///
///         Uniswap V4 reads hook permissions from the hook address itself.
///         The last 14 bits of the address encode which hooks are enabled.
///         To deploy a hook, you must find a salt such that
///         CREATE2(deployer, salt, initCodeHash) has the right bit pattern.
///
///         Adapted from Uniswap v4-template/test/utils/HookMiner.sol
library HookMiner {
    /// @notice Find a salt that produces a hook address with the required flags.
    /// @param deployer The CREATE2 deployer address (usually the script/factory)
    /// @param flags The required hook permission flags (last 14 bits of address)
    /// @param creationCode The contract creation code (including constructor args)
    /// @param maxIterations Maximum number of salts to try before reverting
    /// @return hookAddress The mined hook address
    /// @return salt The salt that produces the hook address
    function find(
        address deployer,
        uint160 flags,
        bytes memory creationCode,
        uint256 maxIterations
    ) internal pure returns (address hookAddress, bytes32 salt) {
        // Extract the flag bits (last 14 bits must match)
        uint160 flagMask = uint160((1 << 14) - 1);
        uint160 requiredBits = flags & flagMask;

        for (uint256 i; i < maxIterations; ++i) {
            salt = bytes32(i);
            hookAddress = computeAddress(deployer, salt, creationCode);

            // Check if the last 14 bits of the address match the required flags
            if (uint160(hookAddress) & flagMask == requiredBits) {
                return (hookAddress, salt);
            }
        }

        revert("HookMiner: could not find salt");
    }

    /// @notice Compute the CREATE2 address for the given parameters.
    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes memory creationCode
    ) internal pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(bytes1(0xff), deployer, salt, keccak256(creationCode))
                    )
                )
            )
        );
    }
}
