#!/usr/bin/env node

/**
 * @heysigil/cli — Verify your GitHub project on Sigil from the terminal.
 *
 * Usage:
 *   npx @heysigil/cli init <wallet>   — Create .sigil, commit, push, scan
 *   npx @heysigil/cli scan [repo]     — Trigger a scan for a repo
 *
 * No dependencies. Uses only Node.js built-ins.
 */

import { execSync } from "node:child_process";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";

const SIGIL_API = process.env.SIGIL_API_URL || "https://api.heysigil.com";
const WALLET_RE = /^0x[0-9a-fA-F]{40}$/;

// ─── Helpers ────────────────────────────────────────────

function log(msg) {
    console.log(msg);
}

function error(msg) {
    console.error(`\n❌ ${msg}`);
    process.exit(1);
}

function confirm(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(`${question} (y/n): `, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === "y");
        });
    });
}

function exec(cmd) {
    return execSync(cmd, { encoding: "utf-8" }).trim();
}

/**
 * Detect the GitHub repo from the current git remote.
 */
function detectRepo() {
    try {
        const remote = exec("git remote get-url origin");
        // SSH: git@github.com:owner/repo.git
        const sshMatch = remote.match(/git@github\.com:(.+?)(?:\.git)?$/);
        if (sshMatch) return sshMatch[1];
        // HTTPS: https://github.com/owner/repo.git
        const httpsMatch = remote.match(/github\.com\/(.+?)(?:\.git)?$/);
        if (httpsMatch) return httpsMatch[1];
        return null;
    } catch {
        return null;
    }
}

/**
 * POST to the Sigil scan endpoint using native fetch.
 */
async function postScan(repo) {
    const url = new URL(`/api/attest/scan`, SIGIL_API);
    const body = JSON.stringify({ repo });

    const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "@heysigil/cli",
        },
        body,
    });

    return { status: res.status, data: await res.json() };
}

// ─── Commands ───────────────────────────────────────────

async function cmdInit(walletAddress) {
    if (!walletAddress) {
        error("Usage: heysigil init <wallet_address>\n  Example: heysigil init 0x1234567890abcdef1234567890abcdef12345678");
    }

    if (!WALLET_RE.test(walletAddress)) {
        error(`Invalid wallet address: ${walletAddress}\n  Must be 0x followed by 40 hex characters`);
    }

    // Detect repo
    const repo = detectRepo();
    if (!repo) {
        error("Could not detect GitHub repository.\n  Make sure you're in a git repo with a GitHub remote.");
    }

    log(`\n🔍 Detected repo: github.com/${repo}`);

    // Check if .sigil already exists
    if (existsSync(".sigil")) {
        const existing = readFileSync(".sigil", "utf-8").trim();
        log(`⚠️  .sigil file already exists:\n\n  ${existing}\n`);
        const overwrite = await confirm("Overwrite?");
        if (!overwrite) {
            log("Aborted.");
            process.exit(0);
        }
    }

    // Show what we'll create
    const fileContent = `wallet: ${walletAddress}\n`;
    log(`\n📝 Creating .sigil with contents:\n`);
    log(`  wallet: ${walletAddress}\n`);

    const proceed = await confirm("Commit and push this file?");
    if (!proceed) {
        log("Aborted.");
        process.exit(0);
    }

    // Create file
    writeFileSync(".sigil", fileContent);
    log("✓ Created .sigil");

    // Git add + commit + push
    try {
        exec("git add .sigil");
        exec('git commit -m "add sigil attestation"');
        log("✓ Committed to current branch");

        exec("git push");
        log("✓ Pushed to origin");
    } catch (err) {
        error(`Git operations failed: ${err.message}\n  You can manually run: git add .sigil && git commit -m "add sigil" && git push`);
    }

    // Ask to trigger scan
    log("");
    const doScan = await confirm("🔍 Notify Sigil to scan your repo?");
    if (!doScan) {
        log(`\nDone! To trigger the scan later, run:\n  npx @heysigil/cli scan ${repo}`);
        process.exit(0);
    }

    await triggerScan(repo);
}

async function cmdScan(repo) {
    if (!repo) {
        // Try to auto-detect
        repo = detectRepo();
        if (!repo) {
            error("Usage: heysigil scan <owner/repo>\n  Or run from inside a git repo with a GitHub remote.");
        }
    }

    log(`\n🔍 Scanning github.com/${repo} for .sigil file...`);
    await triggerScan(repo);
}

async function triggerScan(repo) {
    try {
        const result = await postScan(repo);

        if (result.status === 200 && result.data.success) {
            const d = result.data;
            if (d.alreadyAttested) {
                log(`\n✅ Already attested!`);
            } else {
                log(`\n✅ Attestation created!`);
            }
            log(`   Attestation UID: ${d.attestationUid}`);
            if (d.txHash) log(`   TX Hash: ${d.txHash}`);
            log(`   Project: ${d.projectId}`);
            log(`   Wallet: ${d.walletAddress}`);
            log(`\n🎉 You can now claim fees at https://heysigil.com/dashboard`);
        } else if (result.status === 404) {
            log(`\n⚠️  ${result.data.error}`);
            if (result.data.hint) log(`   ${result.data.hint}`);
        } else {
            log(`\n❌ Scan failed: ${result.data.error || "Unknown error"}`);
            if (result.data.hint) log(`   ${result.data.hint}`);
        }
    } catch (err) {
        error(`Failed to reach Sigil API: ${err.message}\n  Try again later or check https://heysigil.com/status`);
    }
}

// ─── Main ───────────────────────────────────────────────

const [, , command, ...args] = process.argv;

switch (command) {
    case "init":
        cmdInit(args[0]);
        break;
    case "scan":
        cmdScan(args[0]);
        break;
    case "--help":
    case "-h":
    case undefined:
        log(`
  @heysigil/cli — Verify your GitHub project on Sigil

  Usage:
    npx @heysigil/cli init <wallet>   Create .sigil file, commit, push, and verify
    npx @heysigil/cli scan [repo]     Trigger a scan for a repo

  Don't trust this CLI? Just do it manually:
    echo "wallet: 0xYOUR_ADDRESS" > .sigil
    git add .sigil && git commit -m "add sigil" && git push

  Then visit: https://heysigil.com/scan?repo=owner/repo

  Options:
    --help, -h    Show this help message
    --version     Show version

  Environment:
    SIGIL_API_URL   Override API endpoint (default: https://api.heysigil.com)
`);
        break;
    case "--version":
        log("1.0.0");
        break;
    default:
        error(`Unknown command: ${command}\n  Run "heysigil --help" for usage.`);
}
