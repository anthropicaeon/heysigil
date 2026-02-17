---
name: post-refactor-guardrails
description: Mandatory checks after any refactor, migration, or multi-file code change to prevent deploy breakages
---

# Post-Refactor Guardrails

After any refactor involving file moves, renames, import changes, or large multi-file edits, follow these rules to prevent the breakages we saw on Feb 17 2026.

---

## 1. Import Verification (CRITICAL)

> **What broke**: `RateLimitResponseSchema` was imported from `../schemas/verify.js` but was actually exported from `../schemas/common.js`. File got moved during refactor, import paths didn't follow.

### Rules

- **After moving or renaming any export**, grep every file that imports it:
  ```bash
  grep -rn "ExportName" src/ web/src/ --include="*.ts" --include="*.tsx"
  ```
- **After splitting a file** (e.g., `verify.ts` → `verify.ts` + `common.ts`), check EVERY consumer of the original file
- **Never assume IDE auto-import is correct** when doing bulk refactors — verify manually
- **Run TypeScript compilation** before committing:
  ```bash
  npx tsc --noEmit
  ```

### Scan Pattern

After any refactor, run this sweep:
```bash
# Find all .ts/.tsx files that import from changed modules
grep -rn "from.*changed-module" src/ web/src/ --include="*.ts" --include="*.tsx"

# Verify each export exists where it's imported from
# For each import { X } from "Y", ensure Y actually exports X
```

---

## 2. Missing Imports

> **What broke**: `launch.ts` used `z.union()` but never imported `z` from `zod`. Worked before because an earlier version didn't use `z` directly.

### Rules

- **When adding a symbol usage** (e.g., `z.union()`), verify the import exists at the top of that file
- **After extracting shared schemas**, ensure every file that uses `z` still imports it
- **TypeScript compilation catches this** — always run `npx tsc --noEmit` before pushing

---

## 3. Lockfile Synchronization (Bun vs npm)

> **What broke**: `npm install` was used to update `@privy-io/react-auth`, which updated `package.json` and `package-lock.json` but NOT `bun.lock`. Railway runs `bun install --frozen-lockfile` and failed.

### Rules

- **This project uses Bun for the `web/` frontend**. ALWAYS use `bun install` for web packages:
  ```bash
  cd web && bun add @privy-io/react-auth@latest
  ```
- **Never use `npm install` in `web/`** — it creates/updates `package-lock.json` but not `bun.lock`
- **After ANY package change in `web/`**, verify `bun.lock` is updated:
  ```bash
  cd web && bun install && git add bun.lock
  ```
- **The backend (root) uses npm** via `railway.toml` → `installCommand = "bun install"` / `buildCommand = "npm install"`. Use npm for root-level packages.

### Quick Reference

| Directory | Package Manager | Lockfile      | Install Command |
|-----------|----------------|---------------|-----------------|
| `/` (root) | npm           | package-lock.json | `npm install` |
| `/web`    | Bun            | bun.lock      | `bun install`   |

---

## 4. Third-Party SDK Configuration (Privy, Auth, etc.)

> **What broke**: Privy SDK was configured with `loginMethods: ["telegram"]` but Telegram wasn't set up in the Privy dashboard. `embeddedWallets` config caused init issues. Modal CSS was hidden behind app z-index stacking.

### Rules

- **Only include login methods that are configured in the Privy dashboard**
  - Currently enabled: `["email", "wallet", "github"]`
  - Do NOT add `"telegram"`, `"farcaster"`, `"discord"`, etc. without first configuring them in [dashboard.privy.io](https://dashboard.privy.io)
- **Privy `NEXT_PUBLIC_PRIVY_APP_ID` is baked at build time** — changing the env var requires a full REBUILD, not just a restart
- **Privy allowed origins** must match the deployment domain exactly (check dashboard → Domains tab)
- **CSS z-index**: Privy's modal needs to be above all app content. The globals.css has overrides at the bottom — keep them there:
  ```css
  #privy-modal-root,
  #privy-dialog,
  [data-privy-dialog],
  [data-privy-modal] {
    z-index: 2147483647 !important;
  }
  ```

---

## 5. Environment Variable Prefixes (Next.js)

> **What broke**: `.env` had `PRIVY_APP_ID` but the frontend needs `NEXT_PUBLIC_PRIVY_APP_ID`. Without the prefix, Next.js doesn't expose it to client-side code.

### Rules

- **Client-side env vars MUST start with `NEXT_PUBLIC_`** in Next.js
- **Server-only secrets** (API keys, private keys) must NOT have the `NEXT_PUBLIC_` prefix
- **`NEXT_PUBLIC_` vars are baked at build time**, not runtime — redeploy to pick up changes

### Current Frontend Env Vars

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy auth | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

---

## 6. Railway Deploy Checklist

Before pushing any commit that changes dependencies or configuration:

1. **TypeScript compiles**: `npx tsc --noEmit` (both root and `web/`)
2. **Lockfile sync**: If `web/package.json` changed → `cd web && bun install`
3. **Import scan**: `grep -rn` for any moved/renamed exports
4. **Env vars**: Any new `NEXT_PUBLIC_` vars must be set in Railway frontend service
5. **Push and monitor**: Watch Railway build logs for errors

---

## 7. Large Refactor Protocol

When doing big refactors (>10 files), follow this protocol:

### Before
- [ ] Document which exports are moving and where
- [ ] List all consumers of those exports

### During
- [ ] Update imports file-by-file, checking each one
- [ ] Run `npx tsc --noEmit` after each batch of changes
- [ ] Keep commits atomic — one logical change per commit

### After
- [ ] Full TypeScript compilation passes
- [ ] Lockfiles are in sync (`bun.lock`, `package-lock.json`)
- [ ] `grep` for any orphaned imports (importing from deleted/moved files)
- [ ] Test critical paths: chat, verify, auth, wallet
- [ ] Monitor Railway deploy logs for 2 minutes after push

---

## 8. Common Gotchas

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `X is not defined` at runtime | Missing import | Add import statement |
| `X is not exported from Y` | Export moved to different file | Update import path |
| `bun install --frozen-lockfile` fails | `bun.lock` stale | Run `bun install` and commit |
| Privy "Loading..." stuck | `NEXT_PUBLIC_PRIVY_APP_ID` missing or wrong | Check Railway env vars, rebuild |
| Privy modal invisible | CSS z-index conflict | Check globals.css Privy overrides |
| Env var undefined client-side | Missing `NEXT_PUBLIC_` prefix | Rename var, rebuild |
| Railway deploy works but app crashes | Runtime import error | Check Railway logs, fix import |
