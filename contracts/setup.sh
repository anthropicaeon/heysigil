#!/bin/bash
# Run this to install all Foundry dependencies for Sigil contracts
set -e

echo "Installing Foundry dependencies..."

forge install foundry-rs/forge-std --no-commit
forge install Uniswap/v4-core --no-commit
forge install Uniswap/v4-periphery --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit

echo "Done. Run 'forge build' to compile."
