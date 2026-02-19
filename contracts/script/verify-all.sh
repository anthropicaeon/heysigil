#!/usr/bin/env bash
# ─── Verify All Sigil Contracts on Basescan ───────────────────────
# Run from contracts/ directory:
#   bash script/verify-all.sh
#
# Requires: BASESCAN_API_KEY in .env or environment

set -euo pipefail

# Load API key from parent .env
BASESCAN_API_KEY="${BASESCAN_API_KEY:-UNETNBD41SBNWVDB625ER7YXN9RH7X2US2}"
RPC="https://mainnet.base.org"
CHAIN_ID=8453

# ─── Contract Addresses ───────────────────────────────────
FACTORY_V3="0x64f41e896aC48d8e91388eDF6FabCff14eCbBEe9"
LP_LOCKER="0x2fFffA6519cFFB738c0f017252384A8c5B18219F"
FEE_VAULT="0xc7a27840141c7e89cb39d58bed0e75689bb6f933"
DEPLOYER_ADDR="0xfc1Dcf33433DA8D84FA4423229237eD1e772D680"

# External addresses used as constructor args
POSITION_MANAGER="0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1"
V3_FACTORY="0x33128a8fC17869897dcE68Ed026d694621f6FDfD"
USDC="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

# Default supply for SigilToken: 100 billion * 10^18
DEFAULT_SUPPLY="100000000000000000000000000000"

VERIFY_ARGS="--etherscan-api-key $BASESCAN_API_KEY --chain $CHAIN_ID --watch"

echo "═══════════════════════════════════════════════════════"
echo "  Sigil Contract Verification on Basescan"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── 1. Verify SigilFeeVault ─────────────────────────────
echo "▸ [1/8] Verifying SigilFeeVault at $FEE_VAULT..."
forge verify-contract "$FEE_VAULT" src/SigilFeeVault.sol:SigilFeeVault \
  --constructor-args $(cast abi-encode "constructor(address)" "$DEPLOYER_ADDR") \
  $VERIFY_ARGS || echo "  ⚠ May already be verified or failed"
sleep 2

# ─── 2. Verify SigilLPLocker ─────────────────────────────
echo ""
echo "▸ [2/8] Verifying SigilLPLocker at $LP_LOCKER..."
forge verify-contract "$LP_LOCKER" src/SigilLPLocker.sol:SigilLPLocker \
  --constructor-args $(cast abi-encode "constructor(address,address,address,address,address)" \
    "$POSITION_MANAGER" "$FEE_VAULT" "$FACTORY_V3" "$USDC" "$DEPLOYER_ADDR") \
  $VERIFY_ARGS || echo "  ⚠ May already be verified or failed"
sleep 2

# ─── 3. Verify SigilFactoryV3 (likely already verified) ──
echo ""
echo "▸ [3/8] Verifying SigilFactoryV3 at $FACTORY_V3..."
forge verify-contract "$FACTORY_V3" src/SigilFactoryV3.sol:SigilFactoryV3 \
  --constructor-args $(cast abi-encode "constructor(address,address,address,address)" \
    "$V3_FACTORY" "$POSITION_MANAGER" "$LP_LOCKER" "$USDC") \
  $VERIFY_ARGS || echo "  ⚠ May already be verified or failed"
sleep 2

# ─── 4-8. Verify Launched SigilTokens ────────────────────
# All tokens are SigilToken with constructor(string,string,uint256,address)
# The _recipient for all is the factory address

declare -A TOKENS
TOKENS["0xe83E58eC1de7A6Ec9A8f144A97A4A21863710A8a"]="testicular|TEST"
TOKENS["0xE7815c1FC9Be76d0594294920Cd94Cdf170C10cd"]="Testicular|TEST"
TOKENS["0x1BCF78b91C7B3F5a6a32E5521AdC0cd69bf020fE"]="HeySigil|SIGIL"
TOKENS["0x00C3cAa312cf5F4D0A1340BFfbD3480BBd3EcE3c"]="ConwayResearch|CONWAY"
TOKENS["0x41a26b4Ba46F0F533322Ea4154072817c030cC49"]="Sigil: heysigil|sHEYSIG"

TOKEN_NUM=4
for addr in "${!TOKENS[@]}"; do
  IFS='|' read -r name symbol <<< "${TOKENS[$addr]}"
  echo ""
  echo "▸ [$TOKEN_NUM/8] Verifying SigilToken '$name' ($symbol) at $addr..."
  
  CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(string,string,uint256,address)" \
    "$name" "$symbol" "$DEFAULT_SUPPLY" "$FACTORY_V3")
  
  forge verify-contract "$addr" src/SigilToken.sol:SigilToken \
    --constructor-args "$CONSTRUCTOR_ARGS" \
    $VERIFY_ARGS || echo "  ⚠ May already be verified or failed"
  
  TOKEN_NUM=$((TOKEN_NUM + 1))
  sleep 2
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✓ Verification complete — check Basescan for status"
echo "═══════════════════════════════════════════════════════"
