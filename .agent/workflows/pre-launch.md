---
description: Pre-launch checklist for going live with Sigil
---

# Sigil Pre-Launch Checklist

These items must be completed before going fully live.

## Deployer Wallet (Gasless Launches)
- [ ] Generate a deployer wallet private key
- [ ] Fund with ~0.005 ETH on Base (~$15 covers 100+ launches)
- [ ] Set `DEPLOYER_PRIVATE_KEY` in production `.env`
- [ ] Set `SIGIL_FACTORY_ADDRESS` in production `.env` (after contract deployment)
- [ ] Set `BASE_RPC_URL` to mainnet RPC (e.g., Alchemy/Infura Base endpoint)

## Contract Deployment
- [ ] Deploy `SigilHook` to Base mainnet
- [ ] Deploy `SigilFeeVault` to Base mainnet
- [ ] Deploy `SigilFactory` to Base mainnet
- [ ] Deploy `PoolReward` to Base mainnet
- [ ] Register EAS schema on Base (run `bun run register-schema`)
- [ ] Set `EAS_SCHEMA_UID` in production `.env`

## API Keys & Secrets
- [ ] GitHub OAuth app created, `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` set
- [ ] `ANTHROPIC_API_KEY` set for chat agent
- [ ] `ATTESTATION_SIGNER_KEY` set for EAS attestations
- [ ] `DATABASE_URL` pointing to production Postgres

## Database
- [ ] Production Postgres provisioned
- [ ] Run `bun run db:generate && bun run db:migrate`

## Domain & Hosting
- [ ] Backend deployed (Railway or similar)
- [ ] Frontend deployed
- [ ] `BASE_URL` and `FRONTEND_URL` updated to production domains

## Cost Estimate
- Deployer gas: ~$0.05-0.10 per launch on Base
- 100 launches ≈ $5-10
- Keep deployer wallet above 0.001 ETH minimum
