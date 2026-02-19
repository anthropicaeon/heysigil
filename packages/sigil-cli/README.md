# @heysigil/cli

Verify your GitHub project on [Sigil](https://heysigil.com) without leaving the terminal.

## Quick Start

```bash
npx @heysigil/cli init 0xYOUR_WALLET_ADDRESS
```

That's it. The CLI will:
1. Create a `.sigil` file in your repo root
2. Commit and push it
3. Notify Sigil to scan and create your EAS attestation

## Commands

### `init <wallet>`

Create a `.sigil` file, commit, push, and trigger verification.

```bash
npx @heysigil/cli init 0x1234567890abcdef1234567890abcdef12345678
```

### `scan [repo]`

Trigger a scan for any repo. Auto-detects from your git remote if no repo specified.

```bash
npx @heysigil/cli scan owner/repo
```

## Don't Trust This CLI?

Just do it manually — the CLI only creates a one-line text file:

```bash
echo "wallet: 0xYOUR_ADDRESS" > .sigil
git add .sigil && git commit -m "add sigil" && git push
```

Then trigger the scan:
```bash
curl -X POST https://api.heysigil.com/api/attest/scan \
  -H "Content-Type: application/json" \
  -d '{"repo": "owner/repo"}'
```

## What Is a `.sigil` File?

A single-line file in your repo root that declares your wallet address:

```
wallet: 0x1234567890abcdef1234567890abcdef12345678
```

Only repository admins can push to the default branch, so the file's existence proves ownership. Sigil reads this file and creates an [EAS attestation](https://attest.org/) linking your repo to your wallet.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SIGIL_API_URL` | `https://api.heysigil.com` | Override the API endpoint |

## License

MIT
