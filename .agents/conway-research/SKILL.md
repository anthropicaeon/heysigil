---
name: conway-research-agents
description: Integration patterns for Conway Research autonomous AI infrastructure with the Sigil protocol. Use this when building agents that leverage Conway's cloud, domains, and automaton primitives alongside Sigil verification.
---

# Conway Research Agent Integration

Conway Research builds infrastructure for self-improving, self-replicating, autonomous AI. Their platform provides the primitives that allow AI agents to function without a human in the loop. This skill documents how Conway-powered agents interact with Sigil.

**Website**: [conway.tech](https://conway.tech)
**Twitter**: [@ConwayResearch](https://x.com/ConwayResearch)
**Contact**: root@conway.tech

## Agent Identity

- **Type**: Infrastructure-level autonomous AI
- **Philosophy**: The majority of future internet participants will be AI agents that outnumber humans by orders of magnitude and transact at machine speed
- **Auth Model**: Cryptographic key-pair identity (no human-centric authentication)
- **Payment Model**: Stablecoin-native (agents pay with USDC/USDT directly)

## Conway Infrastructure Primitives

### 1. Cloud
AI-native infrastructure where agents provision and pay for their own Linux VMs and compute resources. Agents deploy applications independently without human gatekeepers.

### 2. Domains
Enables AI agents to register and manage their own domain names autonomously. Agents maintain their own web presence and API endpoints.

### 3. Automaton
A framework for AI that can:
- **Earn its own existence** — generate revenue to cover compute costs
- **Replicate** — spawn new agent instances as needed
- **Evolve** — self-improve through iterative learning loops

### 4. MCP Tools (`npx conway-terminal`)
Model Context Protocol tools that provide AI agents with write access to the real world. Installable via:
```bash
npx conway-terminal
```

## Conway Design Principles

These principles align with Sigil's architecture:

| Principle | Conway | Sigil |
|-----------|--------|-------|
| **Permissionless** | Infrastructure without human gatekeepers | Verification without approval processes |
| **Stablecoin-based** | Payments in stablecoins | Fee routing in USDC |
| **Key-pair Identity** | Cryptographic identity | Onchain attestations via EAS |
| **Machine-speed** | Agent-to-agent transactions | Automated fee claims and governance |

## Sigil Integration Patterns

### Agent Key-Pair Attestation
Conway agents use key-pair identity natively — the `agent_keypair` verification method is a direct match for Conway's auth model:
```typescript
import { ethers } from 'ethers';

// 1. Request challenge from Sigil verification API
const res = await fetch("/api/verify/challenge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    method: "agent_keypair",
    projectId: "conway-automaton-001",
    walletAddress: conwayAgentWallet.address
  })
});
const { challengeCode, verificationId } = await res.json();

// 2. Sign with Conway agent's key pair (EIP-191)
const message = `sigil-agent-verify:${challengeCode}`;
const signature = await conwayAgentWallet.signMessage(message);

// 3. Submit → EAS attestation issued onchain
await fetch("/api/verify/check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    verificationId,
    proofData: JSON.stringify({ signature, challengeCode })
  })
});
```

### Token Launch (via agent:// identifier)
Conway agents launch tokens using the `agent://` protocol prefix:
```typescript
const launch = await fetch("/api/deploy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Conway Automaton Token",
    symbol: "sCONWAY",
    projectId: "conway-automaton-001",
    isSelfLaunch: false,
    devLinks: ["agent://conway-automaton-001"]
  })
});
const { tokenAddress, poolId } = await launch.json();
```

### Fee Claiming
Conway agents claim USDC fees from the SigilFeeVault using stablecoins:
```typescript
const feeVault = new ethers.Contract(FEE_VAULT_ADDRESS, FEE_VAULT_ABI, conwayAgentWallet);

// Query claimable fees
const claimable = await feeVault.devFees(conwayAgentWallet.address);
if (claimable > 0n) {
  const tx = await feeVault.claimDevFees();
  await tx.wait(1);
}
```

### Agent-to-Agent Trust
Conway agents use Sigil attestation scores for trust decisions:
```typescript
// Before transacting with another agent, check their Sigil score
const peerAttestation = await sigil.getAttestation({
  address: peerAgentAddress
});

const trustThreshold = 3; // minimum score of 3/5
if (peerAttestation.score >= trustThreshold) {
  await conwayCloud.executeTransaction(peerAgentAddress, payload);
}
```

### Automaton + Milestone Governance
Self-replicating agents participate in Sigil's milestone governance:
```typescript
// Automaton agent monitors milestones and votes based on verifiable progress
const milestones = await sigil.getMilestones(projectId);

for (const milestone of milestones) {
  const verified = await automatonAgent.verifyMilestoneCompletion(milestone);
  if (verified) {
    await sigil.voteMilestone(milestone.id, 'approve');
  }
}
```

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐
│  Conway Cloud    │     │  Sigil Protocol  │
│  (Compute/VMs)  │────▶│  (Verification)  │
├─────────────────┤     ├──────────────────┤
│  Conway Domains  │────▶│  EAS Attestation │
├─────────────────┤     ├──────────────────┤
│  Automaton       │────▶│  Governance      │
├─────────────────┤     ├──────────────────┤
│  MCP Tools       │────▶│  Fee Routing     │
└─────────────────┘     └──────────────────┘
```

## Configuration

Environment variables for Conway + Sigil agent setup:

```env
# Conway Infrastructure
CONWAY_API_KEY=your_conway_key
CONWAY_CLOUD_REGION=us-east-1
CONWAY_DOMAIN=agent.example.com

# Sigil Protocol
SIGIL_API_KEY=your_sigil_key
SIGIL_CHAIN_ID=8453
SIGIL_FACTORY_ADDRESS=0x...
SIGIL_FEE_VAULT_ADDRESS=0x...

# Agent Identity
AGENT_KEYPAIR_PATH=/path/to/keypair.json
AGENT_STABLECOIN=USDC
AGENT_TRUST_THRESHOLD=3
```
