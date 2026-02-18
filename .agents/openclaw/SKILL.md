---
name: openclaw-agents
description: Integration patterns for OpenCLaw autonomous AI agents with the Sigil protocol. Use this when building or configuring OpenCLaw agents that interact with Sigil verification, fee routing, or governance.
---

# OpenCLaw Agent Integration

OpenCLaw is an open-source autonomous AI agent that performs tasks on a user's computer without human intervention. This skill documents how OpenCLaw agents interact with Sigil's verification infrastructure.

## Agent Identity

- **Type**: Autonomous computer-use agent
- **Capabilities**: Desktop/browser interaction, crypto wallet management, DeFi operations, AML compliance
- **Auth Model**: Key-pair identity — agents hold their own private keys and sign transactions directly

## Core Capabilities

### 1. Computer Use
OpenCLaw agents interact with browsers and desktop applications autonomously. They can navigate web interfaces, fill forms, and execute multi-step workflows without human oversight.

### 2. Crypto Operations
- Create and manage wallets (ETH, BTC, stablecoins)
- Execute trades on DEXs (Uniswap, etc.)
- Interact with smart contracts directly
- Claim fees, stake tokens, and manage LP positions

### 3. AML Compliance
- Real-time risk assessment on wallet addresses
- Sanctions screening before transacting
- Investigation intelligence and reporting

## Sigil Integration Patterns

### Agent Key-Pair Attestation (No GitHub Required)
Agents attest identity via cryptographic signature — no GitHub, no OAuth:
```typescript
import { ethers } from 'ethers';

// 1. Request challenge
const res = await fetch("/api/verify/challenge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    method: "agent_keypair",
    projectId: "openclaw-agent",
    walletAddress: agentWallet.address
  })
});
const { challengeCode, verificationId } = await res.json();

// 2. Sign challenge with agent's private key (EIP-191)
const message = `sigil-agent-verify:${challengeCode}`;
const signature = await agentWallet.signMessage(message);

// 3. Submit for verification → EAS attestation issued onchain
await fetch("/api/verify/check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    verificationId,
    proofData: JSON.stringify({ signature, challengeCode })
  })
});
```

### Querying Attestations
```typescript
import { SigilClient } from '@sigil/sdk';

const sigil = new SigilClient({ chainId: 8453 });

// Agent verifies a builder before transacting
const attestation = await sigil.getAttestation({
  address: builderAddress
});

if (attestation.score >= 3 && attestation.verified) {
  // Proceed with transaction
}
```

### Token Launch (via agent:// identifier)
Agents launch tokens using `agent://` prefix instead of GitHub links:
```typescript
// Agent launches a token via the deployer API
const launch = await fetch("/api/deploy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "AgentToken",
    symbol: "sAGT",
    projectId: "openclaw-agent",
    isSelfLaunch: false,
    devLinks: ["agent://openclaw-agent"]  // ← agent:// prefix, not a GitHub URL
  })
});
const { tokenAddress, poolId } = await launch.json();
```

### Fee Claiming
```typescript
// Query claimable USDC from SigilFeeVault
const feeVault = new ethers.Contract(FEE_VAULT_ADDRESS, FEE_VAULT_ABI, agentWallet);
const claimable = await feeVault.devFees(agentWallet.address);

if (claimable > 0n) {
  // Claim accumulated fees
  const tx = await feeVault.claimDevFees();
  await tx.wait(1);
}
```

### Governance Participation
```typescript
// Agent votes on milestone proposals
const proposals = await sigil.getActiveProposals();
for (const proposal of proposals) {
  const analysis = await agent.analyzeProposal(proposal);
  if (analysis.shouldVote) {
    await sigil.vote(proposal.id, analysis.direction);
  }
}
```

## Security Considerations

- **Key Management**: Agent private keys should be stored in secure enclaves or TEEs when possible
- **Transaction Limits**: Configure maximum transaction amounts to limit exposure
- **Approval Gates**: For high-value operations, require human approval before execution
- **Audit Logging**: All agent transactions should be logged for compliance review

## Configuration

Environment variables for OpenCLaw agent setup:

```env
# Sigil Protocol
SIGIL_API_KEY=your_api_key
SIGIL_CHAIN_ID=8453
SIGIL_FACTORY_ADDRESS=0x...
SIGIL_FEE_VAULT_ADDRESS=0x...

# Agent Wallet
AGENT_PRIVATE_KEY=0x...
AGENT_MAX_TX_VALUE=1000  # USDC
```
