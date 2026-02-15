"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Method = {
  id: string;
  name: string;
  description: string;
  projectIdFormat: string;
  requiresOAuth: boolean;
};

const METHODS: Method[] = [
  {
    id: "github_oauth",
    name: "GitHub OAuth",
    description: "Verify admin access to a GitHub repository",
    projectIdFormat: "owner/repo",
    requiresOAuth: true,
  },
  {
    id: "github_file",
    name: "GitHub File",
    description: "Place a verification file in your GitHub repo",
    projectIdFormat: "owner/repo",
    requiresOAuth: false,
  },
  {
    id: "domain_dns",
    name: "DNS TXT Record",
    description: "Add a DNS TXT record to prove domain ownership",
    projectIdFormat: "example.com",
    requiresOAuth: false,
  },
  {
    id: "domain_file",
    name: "Well-Known File",
    description: "Place a verification file on your website",
    projectIdFormat: "example.com",
    requiresOAuth: false,
  },
  {
    id: "domain_meta",
    name: "HTML Meta Tag",
    description: "Add a meta tag to your website's <head>",
    projectIdFormat: "example.com",
    requiresOAuth: false,
  },
  {
    id: "tweet_zktls",
    name: "Tweet + zkTLS",
    description: "Tweet a code, prove it cryptographically (no X API needed)",
    projectIdFormat: "twitter_handle",
    requiresOAuth: false,
  },
  {
    id: "facebook_oauth",
    name: "Facebook Page",
    description: "Verify you admin a Facebook Page",
    projectIdFormat: "Page name or ID",
    requiresOAuth: true,
  },
  {
    id: "instagram_graph",
    name: "Instagram Business",
    description: "Verify an Instagram Business/Creator account",
    projectIdFormat: "username",
    requiresOAuth: true,
  },
];

type Step = "method" | "details" | "challenge" | "result";

interface ChallengeResponse {
  verificationId: string;
  challengeCode: string;
  method: string;
  projectId: string;
  walletAddress: string;
  instructions: string;
  authUrl?: string;
  expiresAt: string;
}

interface CheckResult {
  verificationId: string;
  status: string;
  success: boolean;
  error?: string;
}

const STEP_LABELS = ["Method", "Details", "Verify", "Stamp"];

export default function VerifyFlow() {
  const [step, setStep] = useState<Step>("method");
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [projectId, setProjectId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stepIndex = ["method", "details", "challenge", "result"].indexOf(step);

  async function createChallenge() {
    if (!selectedMethod || !projectId || !walletAddress) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/verify/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod.id,
          projectId,
          walletAddress,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data: ChallengeResponse = await res.json();
      setChallenge(data);

      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }

      setStep("challenge");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create challenge");
    } finally {
      setLoading(false);
    }
  }

  async function checkVerification() {
    if (!challenge) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/verify/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: challenge.verificationId }),
      });

      const data: CheckResult = await res.json();
      setCheckResult(data);

      if (data.success) {
        setStep("result");
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check verification");
    } finally {
      setLoading(false);
    }
  }

  async function claimAttestation() {
    if (!challenge) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: challenge.verificationId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setCheckResult((prev) => prev ? { ...prev, ...data } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create attestation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Progress steps */}
      <div className="steps">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={`step ${i === stepIndex ? "active" : ""} ${i < stepIndex ? "completed" : ""}`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {/* Step 1: Choose method */}
      {step === "method" && (
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Choose Verification Method</h2>
          <div className="method-grid">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={`method-option ${selectedMethod?.id === m.id ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={selectedMethod?.id === m.id}
                  onChange={() => setSelectedMethod(m)}
                />
                <div className="method-info">
                  <h4>{m.name}</h4>
                  <p>{m.description}</p>
                </div>
              </label>
            ))}
          </div>
          <div style={{ marginTop: "var(--space-6)" }}>
            <button
              className="btn-primary"
              disabled={!selectedMethod}
              onClick={() => setStep("details")}
              style={{ width: "100%" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Enter details */}
      {step === "details" && selectedMethod && (
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Project Details</h2>
          <div className="card">
            <div className="form-group">
              <label>Project Identifier</label>
              <input
                type="text"
                placeholder={selectedMethod.projectIdFormat}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  marginTop: "var(--space-1)",
                  display: "block",
                }}
              >
                Format: {selectedMethod.projectIdFormat}
              </span>
            </div>
            <div className="form-group">
              <label>Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <div className="result-box result-error">
              <p style={{ color: "var(--error)", fontSize: "var(--text-sm)" }}>{error}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <button className="btn-secondary" onClick={() => setStep("method")}>
              Back
            </button>
            <button
              className="btn-primary"
              disabled={!projectId || !walletAddress || loading}
              onClick={createChallenge}
              style={{ flex: 1 }}
            >
              {loading ? "Creating..." : selectedMethod.requiresOAuth ? "Authorize" : "Get Instructions"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Follow instructions */}
      {step === "challenge" && challenge && (
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Complete Verification</h2>
          <div className="card">
            <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
              Follow these instructions, then click &quot;Check Verification&quot;:
            </p>
            <div className="instructions">{challenge.instructions}</div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
              Challenge code: <code style={{ fontFamily: "var(--font-mono)" }}>{challenge.challengeCode}</code>
            </p>
          </div>
          {error && (
            <div className="result-box result-error">
              <p style={{ color: "var(--error)", fontSize: "var(--text-sm)" }}>{error}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <button className="btn-secondary" onClick={() => setStep("details")}>
              Back
            </button>
            <button
              className="btn-primary"
              disabled={loading}
              onClick={checkVerification}
              style={{ flex: 1 }}
            >
              {loading ? "Checking..." : "Check Verification"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === "result" && checkResult && (
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Sigil Stamped</h2>
          <div className="result-box result-success">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              <span className="status-badge status-verified">Verified</span>
            </div>
            <p style={{ color: "var(--success)", fontSize: "var(--text-sm)" }}>
              Project ownership verified for <strong>{challenge?.projectId}</strong>
            </p>
          </div>
          <div className="card" style={{ marginTop: "var(--space-4)" }}>
            <h3 style={{ marginBottom: "var(--space-2)" }}>
              Stamp Your Sigil On-Chain
            </h3>
            <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              Create an EAS attestation on Base. Your on-chain stamp of approval starts
              USDC fee earnings from LP activity. Native tokens remain locked until
              community milestone votes.
            </p>
            <button
              className="btn-primary"
              disabled={loading}
              onClick={claimAttestation}
              style={{ width: "100%" }}
            >
              {loading ? "Stamping..." : "Stamp Sigil"}
            </button>
          </div>
          {(checkResult as any).attestationUid && (
            <div className="result-box result-success" style={{ marginTop: "var(--space-4)" }}>
              <p style={{ color: "var(--success)", fontSize: "var(--text-sm)" }}>
                Sigil stamped. UID: <code style={{ fontFamily: "var(--font-mono)" }}>{(checkResult as any).attestationUid}</code>
              </p>
              <p style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-2)", color: "var(--text-secondary)" }}>
                Your stamp is on-chain. USDC fees from LP activity will flow to your
                wallet. Native tokens remain locked until community milestone votes pass.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
