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

export default function VerifyFlow() {
  const [step, setStep] = useState<Step>("method");
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [projectId, setProjectId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      // For OAuth methods, redirect to the auth URL
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
        <div className={`step ${step === "method" ? "active" : ""} ${["details", "challenge", "result"].includes(step) ? "completed" : ""}`}>
          1. Method
        </div>
        <div className={`step ${step === "details" ? "active" : ""} ${["challenge", "result"].includes(step) ? "completed" : ""}`}>
          2. Details
        </div>
        <div className={`step ${step === "challenge" ? "active" : ""} ${step === "result" ? "completed" : ""}`}>
          3. Verify
        </div>
        <div className={`step ${step === "result" ? "active" : ""}`}>
          4. Stamp
        </div>
      </div>

      {/* Step 1: Choose method */}
      {step === "method" && (
        <div>
          <h2>Choose Verification Method</h2>
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
          <div style={{ marginTop: "1.5rem" }}>
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
          <h2>Project Details</h2>
          <div className="card">
            <div className="form-group">
              <label>Project Identifier</label>
              <input
                type="text"
                placeholder={selectedMethod.projectIdFormat}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>
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
              <p style={{ color: "var(--error)", fontSize: "0.85rem" }}>{error}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
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

      {/* Step 3: Follow instructions and verify */}
      {step === "challenge" && challenge && (
        <div>
          <h2>Complete Verification</h2>
          <div className="card">
            <p style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              Follow these instructions, then click "Check Verification":
            </p>
            <div className="instructions">{challenge.instructions}</div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Challenge code: <code>{challenge.challengeCode}</code>
            </p>
          </div>
          {error && (
            <div className="result-box result-error">
              <p style={{ color: "var(--error)", fontSize: "0.85rem" }}>{error}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
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

      {/* Step 4: Result + claim */}
      {step === "result" && checkResult && (
        <div>
          <h2>Sigil Stamped</h2>
          <div className="result-box result-success">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span className="status-badge status-verified">Verified</span>
            </div>
            <p style={{ color: "var(--success)", fontSize: "0.9rem" }}>
              Project ownership verified for <strong>{challenge?.projectId}</strong>
            </p>
          </div>
          <div className="card" style={{ marginTop: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              Stamp Your Sigil On-Chain
            </h3>
            <p style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
              Create an EAS attestation on Base — your on-chain stamp of approval.
              This starts your USDC fee earnings from LP activity. Your native
              tokens remain locked until the community votes on milestones.
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
            <div className="result-box result-success" style={{ marginTop: "1rem" }}>
              <p style={{ color: "var(--success)", fontSize: "0.85rem" }}>
                Sigil stamped! UID: <code>{(checkResult as any).attestationUid}</code>
              </p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "var(--text-secondary)" }}>
                Your stamp of approval is on-chain. USDC fees from LP activity will
                flow to your wallet. Your native tokens remain locked until community
                milestone votes pass.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
