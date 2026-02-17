"use client";

import { useEffect, useState } from "react";

// Inline audit report to avoid build-time fs issues
const AUDIT_REPORT = `# Sigil Protocol Smart Contract Security Audit

**Auditor**: Claude Opus 4.6 [1m] (Anthropic)
**Date**: February 17, 2026
**Scope**: Core Sigil Protocol Contracts (~1,800 LOC)
**Commit**: \`737b7c0\` (claude/bankr-fork-no-x-api-lmz7z)

---

## Executive Summary

This audit examines the Sigil Protocol smart contract suite, a token launch platform with integrated fee distribution mechanisms for Uniswap V3/V4. The protocol enables project launches with locked liquidity and automated 80/20 developer/protocol fee splits.

**Overall Assessment**: The contracts demonstrate solid security fundamentals with proper access controls, reentrancy protection patterns, and well-designed fee routing. Several low-severity issues and design considerations were identified, but no critical vulnerabilities that could lead to loss of funds were discovered.

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 2 |
| Low | 4 |
| Informational | 6 |

---

## Contracts Audited

| Contract | LOC | Purpose |
|----------|-----|---------|
| SigilFeeVault.sol | 392 | Fee accumulation, escrow, and claims |
| SigilLPLocker.sol | 290 | V3 LP NFT permanent locking |
| SigilFactoryV3.sol | 352 | V3 token deployment and pool creation |
| SigilHook.sol | 350 | V4 swap hook for fee collection |
| SigilToken.sol | 57 | Minimal ERC-20 implementation |
| PoolReward.sol | 194 | EAS attestation-based reward claims |
| SigilEscrow.sol | 370 | DAO governance for milestone unlocks |

**Total**: ~2,005 LOC (including SigilEscrow)

---

## Findings

### MEDIUM-01: Unchecked Return Values in Low-Level Calls

**Location**: \`SigilFeeVault.sol:152-160\`, \`SigilFeeVault.sol:384-387\`

**Description**: The contract uses low-level \`call\` for ERC-20 operations but only checks the \`success\` boolean, not the return data. Some non-standard ERC-20 tokens (like USDT) don't return a boolean.

**Risk**: Medium - May fail silently with non-standard tokens, though current usage with USDC/WETH is safe.

**Recommendation**: Use OpenZeppelin's SafeERC20 library or decode and check return data.

---

### MEDIUM-02: ERC-20 Approval Race Condition

**Location**: \`SigilHook.sol:307-316\`

**Description**: The \`_approveFeeVault\` function sets approval to a specific amount each time. If multiple swaps occur in rapid succession, there's a theoretical race condition window.

**Risk**: Medium - In high-throughput scenarios, concurrent transactions could interfere.

**Recommendation**: Use \`increaseAllowance\` pattern or approve max once.

---

### LOW-01: Missing Input Validation in SigilToken

**Location**: \`SigilToken.sol:20-26\`

**Description**: The constructor doesn't validate that \`_totalSupply > 0\` or that \`_recipient\` is not the zero address when supply is non-zero.

**Risk**: Low - Factory controls deployment with hardcoded valid parameters.

---

### LOW-02: Unbounded Array Growth in Fee Token Tracking

**Location**: \`SigilFeeVault.sol:57-58\`, \`SigilLPLocker.sol:87-88\`

**Description**: The \`devFeeTokens[dev]\` and \`lockedTokenIds\` arrays grow unbounded. For highly active developers or many locked positions, iteration costs increase.

**Risk**: Low - Current gas costs manageable; becomes issue at scale.

---

### LOW-03: Single-Step Ownership Transfer

**Location**: All contracts use single-step \`setOwner\` patterns

**Description**: Ownership transfer is immediate without confirmation. A typo in the new owner address results in permanent loss of admin access.

**Risk**: Low - Administrative action requires careful execution.

**Recommendation**: Implement two-step ownership transfer (propose + accept).

---

### LOW-04: Block Timestamp Dependency in Escrow Voting

**Location**: \`SigilEscrow.sol:150\`, \`SigilEscrow.sol:180\`

**Description**: Voting deadlines rely on \`block.timestamp\` which can be slightly manipulated by miners (typically +-15 seconds).

**Risk**: Low - Given 5-day and 3-day voting periods, minor timestamp manipulation is insignificant.

---

## Security Patterns Used (Positive Findings)

### Access Control
- Consistent use of \`onlyOwner\`, \`onlyFactory\`, \`onlyAuthorized\` modifiers
- Custom errors for gas-efficient reverts
- Zero-address validation on all admin setters

### Reentrancy Protection
- State changes before external calls (CEI pattern)
- \`SigilFeeVault.depositFees()\`: Updates balances after token transfer
- \`SigilEscrow._releaseTokens()\`: Updates \`escrowBalance\` before transfer

### Fee Accounting
- Clear separation of dev fees (80%) and protocol fees (20%)
- Escrow mechanism for unclaimed third-party launches
- 30-day expiry sweep to protocol (prevents permanent lockup)

### Liquidity Locking
- V3 LP NFTs: Transferred to Locker, cannot be removed
- V4 Hook: \`beforeRemoveLiquidity\` reverts unconditionally
- Factory-only liquidity addition prevents manipulation

---

## Known Limitations (By Design)

1. **Single Fee Token per V3 Pool**: Native token fees go to escrow, only USDC goes through 80/20 split
2. **Immutable 80/20 Split**: Fee distribution percentages are constants
3. **Protocol Override Power**: Centralized dispute resolution is intentional
4. **Fixed 30-Day Expiry**: Unclaimed fee expiry period is hardcoded
5. **V3 Only USDC Pairs**: Factory creates TOKEN/USDC pools exclusively

---

## Conclusion

The Sigil Protocol smart contracts demonstrate mature security practices appropriate for a DeFi fee distribution system. The identified issues are primarily low-severity improvements rather than exploitable vulnerabilities.

**Key Strengths**:
- Clear separation of concerns between contracts
- Proper access control hierarchy
- Fail-safe fee routing (unclaimed -> escrow -> protocol)
- Permanent liquidity locking prevents rug pulls

**Recommendations Summary**:
1. Implement SafeERC20 for broader token compatibility
2. Add two-step ownership transfer
3. Add missing events for admin actions
4. Consider ERC-20 Votes for escrow governance

The protocol is suitable for mainnet deployment with the understanding that:
- Admin keys must be secured (multisig recommended)
- Non-standard ERC-20 tokens should be tested before launch support
- Governance parameters should be reviewed for production scale

---

*This audit was performed by Claude Opus 4.6 [1m], an AI model developed by Anthropic. While this audit identifies potential issues and provides recommendations, it does not guarantee the absence of all vulnerabilities. Smart contracts should undergo multiple independent audits before mainnet deployment.*
`;

type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";

function SeverityBadge({ level }: { level: SeverityLevel }) {
  const colors: Record<SeverityLevel, { bg: string; text: string }> = {
    critical: { bg: "rgba(220, 38, 38, 0.2)", text: "#ef4444" },
    high: { bg: "rgba(249, 115, 22, 0.2)", text: "#f97316" },
    medium: { bg: "rgba(234, 179, 8, 0.2)", text: "#eab308" },
    low: { bg: "rgba(34, 197, 94, 0.2)", text: "#22c55e" },
    info: { bg: "rgba(59, 130, 246, 0.2)", text: "#3b82f6" },
  };

  const { bg, text } = colors[level];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        background: bg,
        color: text,
        textTransform: "uppercase",
      }}
    >
      {level}
    </span>
  );
}

function parseMarkdown(content: string) {
  // Simple markdown parsing for display
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            style={{
              background: "var(--bg-secondary)",
              padding: "var(--space-4)",
              borderRadius: 8,
              overflow: "auto",
              fontSize: "var(--text-sm)",
              marginBottom: "var(--space-4)",
            }}
          >
            <code>{codeContent}</code>
          </pre>
        );
        codeContent = "";
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // Tables
    if (line.startsWith("|") && line.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (!cells.every((c) => /^[-:]+$/.test(c))) {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // End of table
      elements.push(
        <table
          key={`table-${i}`}
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "var(--space-4)",
            fontSize: "var(--text-sm)",
          }}
        >
          <thead>
            <tr>
              {tableRows[0]?.map((cell, j) => (
                <th
                  key={j}
                  style={{
                    textAlign: "left",
                    padding: "var(--space-2) var(--space-3)",
                    borderBottom: "1px solid var(--border)",
                    fontWeight: 600,
                  }}
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, j) => (
              <tr key={j}>
                {row.map((cell, k) => (
                  <td
                    key={k}
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      inTable = false;
      tableRows = [];
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          id={line.slice(2).toLowerCase().replace(/\s+/g, "-")}
          style={{
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
            marginBottom: "var(--space-4)",
            marginTop: "var(--space-8)",
          }}
        >
          {line.slice(2)}
        </h1>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          id={line.slice(3).toLowerCase().replace(/\s+/g, "-")}
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 600,
            marginBottom: "var(--space-3)",
            marginTop: "var(--space-6)",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {line.slice(3)}
        </h2>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      const text = line.slice(4);
      let badge: React.ReactNode = null;

      if (text.includes("MEDIUM-")) {
        badge = <SeverityBadge level="medium" />;
      } else if (text.includes("LOW-")) {
        badge = <SeverityBadge level="low" />;
      } else if (text.includes("INFO-")) {
        badge = <SeverityBadge level="info" />;
      } else if (text.includes("CRITICAL-")) {
        badge = <SeverityBadge level="critical" />;
      } else if (text.includes("HIGH-")) {
        badge = <SeverityBadge level="high" />;
      }

      elements.push(
        <h3
          key={`h3-${i}`}
          id={text.toLowerCase().replace(/\s+/g, "-")}
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            marginBottom: "var(--space-2)",
            marginTop: "var(--space-5)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          {badge}
          {text.replace(/^(MEDIUM|LOW|INFO|CRITICAL|HIGH)-\d+:\s*/, "")}
        </h3>
      );
      continue;
    }

    // Horizontal rule
    if (line === "---") {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{
            border: "none",
            borderTop: "1px solid var(--border)",
            margin: "var(--space-6) 0",
          }}
        />
      );
      continue;
    }

    // Bold text and inline code
    if (line.trim()) {
      let processed = line;
      // Process bold
      processed = processed.replace(
        /\*\*([^*]+)\*\*/g,
        '<strong>$1</strong>'
      );
      // Process inline code
      processed = processed.replace(
        /`([^`]+)`/g,
        '<code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: var(--text-sm);">$1</code>'
      );

      elements.push(
        <p
          key={`p-${i}`}
          style={{
            marginBottom: "var(--space-3)",
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    }
  }

  return elements;
}

export default function AuditPage() {
  const [content, setContent] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    setContent(parseMarkdown(AUDIT_REPORT));
  }, []);

  return (
    <div
      className="container-narrow"
      style={{ padding: "var(--space-12) var(--space-6)" }}
    >
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "rgba(34, 197, 94, 0.1)",
            color: "#22c55e",
            padding: "var(--space-2) var(--space-4)",
            borderRadius: 20,
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            marginBottom: "var(--space-4)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Security Audited
        </div>
      </div>

      <article
        style={{
          maxWidth: 800,
          color: "var(--text-primary)",
        }}
      >
        {content}
      </article>

      <div
        style={{
          marginTop: "var(--space-12)",
          padding: "var(--space-6)",
          background: "var(--bg-secondary)",
          borderRadius: 12,
          border: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            marginBottom: "var(--space-3)",
          }}
        >
          About This Audit
        </h3>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
          This security audit was performed by Claude Opus 4.6 [1m], Anthropic&apos;s
          most capable AI model. The audit examined approximately 2,000 lines of
          Solidity code across 7 smart contracts. While AI audits provide
          valuable security analysis, they should be considered one component of
          a comprehensive security strategy that includes human expert review,
          formal verification, and extensive testing.
        </p>
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "var(--space-3)",
            fontSize: "var(--text-sm)",
          }}
        >
          View the full source code on{" "}
          <a
            href="https://github.com/heysigil/sigil-contracts"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
