"use client";

import {
    Activity,
    Bot,
    Clock3,
    Copy,
    KeyRound,
    ListChecks,
    MessageSquareText,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PixelCard } from "@/components/ui/pixel-card";
import { Textarea } from "@/components/ui/textarea";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { cn } from "@/lib/utils";

type ConnectStep = "stack" | "handshake" | "configure" | "run" | "manage";

type BotStackOption = {
    id: "sigilbot" | "openclaw";
    label: string;
    runtime: string;
    description: string;
};

type ConnectedBot = {
    id: string;
    stack: "sigilbot" | "openclaw";
    endpoint: string;
    status: "connected" | "disconnected";
    connectionId?: string | null;
    botId?: string | null;
    scopes?: string[] | null;
    connectedAt?: string;
    activeTasks: number;
    updatedAt: string;
};

type McpToken = {
    id: string;
    name: string;
    tokenPrefix: string;
    scopes: string[];
    expiresAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
};

type McpScopePreset = {
    id: "runtime-min" | "runtime-full";
    label: string;
    description: string;
    scopes: string[];
};

const STACKS: BotStackOption[] = [
    {
        id: "sigilbot",
        label: "SigilBot",
        runtime: "Primary Stack",
        description: "Sigil-native runtime with direct handshake into /connect and Sigil chat workflows.",
    },
    {
        id: "openclaw",
        label: "OpenClaw",
        runtime: "Plugin Stack",
        description: "Container-first stack for advanced autonomous task execution with same handshake contract.",
    },
];

const FLOW_STAGES = [
    { num: "01", label: "stack" },
    { num: "02", label: "handshake" },
    { num: "03", label: "configure" },
    { num: "04", label: "run" },
    { num: "05", label: "manage" },
] as const;

const STEP_SEQUENCE: ConnectStep[] = ["stack", "handshake", "configure", "run", "manage"];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const MCP_SCOPE_PRESETS: McpScopePreset[] = [
    {
        id: "runtime-min",
        label: "runtime minimal",
        description: "chat + launch read + dashboard visibility",
        scopes: ["chat:write", "launch:read", "dashboard:read"],
    },
    {
        id: "runtime-full",
        label: "runtime full",
        description: "full runtime operations for launch and verification workflows",
        scopes: [
            "verify:read",
            "verify:write",
            "dashboard:read",
            "chat:write",
            "developers:read",
            "launch:read",
            "launch:write",
            "wallet:read",
            "fees:read",
            "claim:write",
        ],
    },
];

// TODO(connect-data): Replace prompt/task mocks with API data from bot profile store.
const MOCK_PROMPT_STAGES = {
    planner: "Break user goal into milestones and estimate risk before execution.",
    executor: "Execute only approved actions, keep output compact and machine-readable.",
    reviewer: "Verify task completion, summarize deltas, and mark follow-up todos.",
};

export default function ConnectFlow() {
    const privy = useOptionalPrivy();
    const [step, setStep] = useState<ConnectStep>("stack");
    const [selectedStack, setSelectedStack] = useState<BotStackOption["id"]>("sigilbot");
    const [endpoint, setEndpoint] = useState("");
    const [secret, setSecret] = useState("");
    const [notes, setNotes] = useState(MOCK_PROMPT_STAGES.planner);
    const [isChecking, setIsChecking] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedBots, setConnectedBots] = useState<ConnectedBot[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [mcpTokens, setMcpTokens] = useState<McpToken[]>([]);
    const [isLoadingTokens, setIsLoadingTokens] = useState(false);
    const [scopePresetId, setScopePresetId] = useState<McpScopePreset["id"]>("runtime-min");
    const [tokenName, setTokenName] = useState("");
    const [tokenExpiresInDays, setTokenExpiresInDays] = useState(30);
    const [isCreatingToken, setIsCreatingToken] = useState(false);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [freshPat, setFreshPat] = useState<string | null>(null);
    const [patCopied, setPatCopied] = useState(false);
    const [isQuickLaunching, setIsQuickLaunching] = useState(false);
    const [launchClaimToken, setLaunchClaimToken] = useState("");
    const [claimStatus, setClaimStatus] = useState<string | null>(null);
    const [claimedProjectId, setClaimedProjectId] = useState<string | null>(null);
    const [claimRepoUrl, setClaimRepoUrl] = useState("");
    const [claimUpdateStatus, setClaimUpdateStatus] = useState<string | null>(null);

    const stepIndex = useMemo(() => STEP_SEQUENCE.indexOf(step), [step]);
    const selectedStackData = STACKS.find((item) => item.id === selectedStack) ?? STACKS[0];
    const isDev = process.env.NODE_ENV === "development";
    const selectedScopePreset = useMemo(
        () => MCP_SCOPE_PRESETS.find((preset) => preset.id === scopePresetId) ?? MCP_SCOPE_PRESETS[0],
        [scopePresetId],
    );
    const activeMcpTokens = useMemo(() => {
        const now = Date.now();
        return mcpTokens.filter((token) => {
            if (token.revokedAt) return false;
            if (!token.expiresAt) return true;
            return new Date(token.expiresAt).getTime() > now;
        });
    }, [mcpTokens]);

    // ─── Fetch connected bots ───────────────────────────────

    const fetchBots = useCallback(async () => {
        if (!privy?.authenticated || !privy?.getAccessToken) return;
        try {
            const token = await privy.getAccessToken();
            const res = await fetch(`${API_BASE}/api/connect/bots`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = (await res.json()) as { bots: ConnectedBot[] };
                setConnectedBots(
                    data.bots.map((b) => ({
                        ...b,
                        activeTasks: 0,
                        updatedAt: b.connectedAt
                            ? new Date(b.connectedAt).toLocaleDateString()
                            : "—",
                    })),
                );
            }
        } catch {
            /* silent — sidebar just stays empty */
        }
    }, [privy]);

    const fetchMcpTokens = useCallback(async () => {
        if (!privy?.authenticated || !privy?.getAccessToken) {
            setMcpTokens([]);
            return;
        }

        setIsLoadingTokens(true);
        try {
            const token = await privy.getAccessToken();
            const res = await fetch(`${API_BASE}/api/mcp/tokens`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) return;
            const data = (await res.json()) as { tokens: McpToken[] };
            setMcpTokens(data.tokens || []);
        } catch {
            /* silent — list just stays empty */
        } finally {
            setIsLoadingTokens(false);
        }
    }, [privy]);

    useEffect(() => {
        void fetchBots();
        void fetchMcpTokens();
    }, [fetchBots, fetchMcpTokens]);

    useEffect(() => {
        if (!patCopied) return;
        const timer = window.setTimeout(() => setPatCopied(false), 2000);
        return () => window.clearTimeout(timer);
    }, [patCopied]);

    // ─── Dev step cycling ───────────────────────────────────

    const cycleDevStep = useCallback(() => {
        setStep((current) => {
            const currentIndex = STEP_SEQUENCE.indexOf(current);
            const nextStep = STEP_SEQUENCE[(currentIndex + 1) % STEP_SEQUENCE.length];

            if (!endpoint && (nextStep === "handshake" || nextStep === "configure" || nextStep === "run" || nextStep === "manage")) {
                setEndpoint("https://your-bot.up.railway.app");
            }

            if (nextStep === "configure" || nextStep === "run" || nextStep === "manage") {
                setIsConnected(true);
            }

            return nextStep;
        });
    }, [endpoint]);

    useEffect(() => {
        if (!isDev) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.shiftKey && event.key === "D") {
                event.preventDefault();
                cycleDevStep();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [cycleDevStep, isDev]);

    // ─── Real handshake ─────────────────────────────────────

    async function runHandshake() {
        if (!privy?.getAccessToken) return;
        setIsChecking(true);
        setError(null);

        try {
            const token = await privy.getAccessToken();
            const intentRes = await fetch(`${API_BASE}/api/connect/intent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ endpoint, stack: selectedStack }),
            });
            const intentData = (await intentRes.json()) as { intentToken?: string; error?: string };
            if (!intentRes.ok || !intentData.intentToken) {
                setError(intentData.error || "Failed to create handshake intent");
                return;
            }

            const res = await fetch(`${API_BASE}/api/connect/handshake`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    endpoint,
                    stack: selectedStack,
                    secret: secret || undefined,
                    intentToken: intentData.intentToken,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || data.detail || "Handshake failed");
                return;
            }

            setIsConnected(true);
            setStep("configure");
            // Refresh bot list
            await fetchBots();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Network error");
        } finally {
            setIsChecking(false);
        }
    }

    // ─── Disconnect bot ─────────────────────────────────────

    async function runOneClickRuntimeLaunch() {
        if (!privy?.getAccessToken) return;
        setIsQuickLaunching(true);
        setError(null);
        setTokenError(null);
        setFreshPat(null);
        setPatCopied(false);

        try {
            const token = await privy.getAccessToken();
            const res = await fetch(`${API_BASE}/api/connect/quick-launch`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    stack: selectedStack,
                    connectSecret: secret || undefined,
                }),
            });

            const data = (await res.json()) as {
                ok?: boolean;
                endpoint?: string;
                runtimeToken?: string;
                error?: string;
            };

            if (!res.ok || !data.ok) {
                setError(data.error || "One-click runtime launch failed");
                return;
            }

            if (data.endpoint) {
                setEndpoint(data.endpoint);
            }
            if (data.runtimeToken) {
                setFreshPat(data.runtimeToken);
            }

            setIsConnected(true);
            setStep("configure");
            await fetchBots();
        } catch (err) {
            setError(err instanceof Error ? err.message : "One-click runtime launch failed");
        } finally {
            setIsQuickLaunching(false);
        }
    }

    async function redeemLaunchClaimToken() {
        if (!launchClaimToken.trim() || !privy?.getAccessToken) return;
        setClaimStatus(null);
        setError(null);

        try {
            const token = await privy.getAccessToken();
            const res = await fetch(`${API_BASE}/api/claim/launch-token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ claimToken: launchClaimToken.trim() }),
            });

            const data = (await res.json()) as {
                success?: boolean;
                message?: string;
                error?: string;
                projectId?: string;
            };
            if (!res.ok || !data.success) {
                setClaimStatus(data.error || "Failed to redeem launch secret");
                return;
            }

            setClaimStatus(data.message || "Launch secret redeemed. You can now update repo/details.");
            setClaimedProjectId(data.projectId || null);
            setLaunchClaimToken("");
        } catch (err) {
            setClaimStatus(err instanceof Error ? err.message : "Failed to redeem launch secret");
        }
    }

    async function updateClaimedProjectMetadata() {
        if (!claimedProjectId || !claimRepoUrl.trim() || !privy?.getAccessToken) return;
        setClaimUpdateStatus(null);

        try {
            const token = await privy.getAccessToken();
            const res = await fetch(`${API_BASE}/api/claim/projects/${encodeURIComponent(claimedProjectId)}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ repoUrl: claimRepoUrl.trim() }),
            });

            const data = (await res.json()) as { success?: boolean; error?: string };
            if (!res.ok || !data.success) {
                setClaimUpdateStatus(data.error || "Failed to update claimed project metadata");
                return;
            }

            setClaimUpdateStatus("Claimed project metadata updated.");
            setClaimRepoUrl("");
        } catch (err) {
            setClaimUpdateStatus(
                err instanceof Error ? err.message : "Failed to update claimed project metadata",
            );
        }
    }

    async function disconnectBot(botId: string) {
        if (!privy?.getAccessToken) return;
        try {
            const token = await privy.getAccessToken();
            await fetch(`${API_BASE}/api/connect/bots/${botId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            await fetchBots();
        } catch {
            /* silent */
        }
    }

    async function createMcpTokenForProjects() {
        if (!privy?.authenticated || !privy?.getAccessToken) return;

        setIsCreatingToken(true);
        setTokenError(null);
        setFreshPat(null);
        setPatCopied(false);

        try {
            const accessToken = await privy.getAccessToken();
            const autoName = `${selectedStackData.label} runtime`;
            const finalName = tokenName.trim() || autoName;

            const res = await fetch(`${API_BASE}/api/mcp/tokens`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    name: finalName,
                    scopes: selectedScopePreset.scopes,
                    expiresInDays: tokenExpiresInDays,
                }),
            });

            const data = (await res.json()) as { token?: string; error?: string };
            if (!res.ok || !data.token) {
                setTokenError(data.error || "Failed to create MCP token");
                return;
            }

            setFreshPat(data.token);
            await fetchMcpTokens();
        } catch (err) {
            setTokenError(err instanceof Error ? err.message : "Failed to create token");
        } finally {
            setIsCreatingToken(false);
        }
    }

    async function copyFreshPat() {
        if (!freshPat) return;
        try {
            await navigator.clipboard.writeText(freshPat);
            setPatCopied(true);
        } catch {
            setPatCopied(false);
        }
    }

    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream">
                {isDev && (
                    <div className="absolute top-2 right-2 z-50 bg-primary/90 px-2 py-1 text-xs font-mono text-primary-foreground">
                        Shift+D: cycle steps
                    </div>
                )}

                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-lavender/30"
                >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                                connect
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                                bot control plane
                            </h1>
                            <p className="text-muted-foreground">
                                Connect deployed SigilBot or OpenClaw runtimes to your Sigil account,
                                then manage chat tasks, cron schedules, and staged prompts from one surface.
                            </p>
                        </div>

                        <div className="border border-border bg-background px-5 py-4 min-w-64">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="size-4 text-primary" />
                                <p className="text-sm font-medium text-foreground">Runtime Status</p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                                {isConnected ? "handshake active" : "awaiting handshake"}
                            </p>
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "size-2",
                                        isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500",
                                    )}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {connectedBots.length} connected instance{connectedBots.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    </div>
                </PixelCard>

                <div className="border-border border-b bg-background grid grid-cols-2 lg:grid-cols-5">
                    {FLOW_STAGES.map((stage, index) => {
                        const stageStep = stage.label as ConnectStep;
                        const isCurrent = step === stageStep;
                        const isCompleted = stepIndex > index;

                        return (
                            <button
                                key={stage.num}
                                type="button"
                                onClick={() => setStep(stageStep)}
                                className={cn(
                                    "px-4 py-4 text-left border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0 transition-colors",
                                    isCurrent && "bg-lavender/35",
                                    isCompleted && !isCurrent && "bg-sage/25",
                                    !isCurrent && !isCompleted && "bg-background hover:bg-sage/15",
                                )}
                            >
                                <p className="text-xs font-bold text-primary">{stage.num}</p>
                                <p className="text-[11px] font-semibold tracking-[0.12em] text-foreground uppercase">
                                    {stage.label}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <div className="grid bg-background lg:grid-cols-[1.45fr_1fr] border-border border-b">
                    <div className="border-border lg:border-r">
                        <div className="px-6 py-5 lg:px-12 border-border border-b bg-secondary/30">
                            <p className="text-xs text-muted-foreground uppercase tracking-[0.14em]">
                                current stage
                            </p>
                            <h2 className="text-lg font-semibold text-foreground lowercase mt-1">
                                {step}
                            </h2>
                        </div>

                        {step === "stack" && (
                            <div className="px-6 py-6 lg:px-12 lg:py-8 space-y-5">
                                <div className="grid gap-0 border border-border sm:grid-cols-2">
                                    {STACKS.map((stack, index) => {
                                        const isActive = selectedStack === stack.id;
                                        return (
                                            <button
                                                key={stack.id}
                                                type="button"
                                                onClick={() => setSelectedStack(stack.id)}
                                                className={cn(
                                                    "p-4 text-left border-border transition-colors",
                                                    index === 0 ? "border-b sm:border-b-0 sm:border-r" : "",
                                                    isActive
                                                        ? "bg-lavender/35"
                                                        : "bg-background hover:bg-sage/15",
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {stack.label}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs">
                                                        {stack.runtime}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {stack.description}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => setStep("handshake")}
                                        disabled={!privy.authenticated}
                                    >
                                        continue to handshake
                                    </Button>
                                    {!privy.authenticated && (
                                        <Button
                                            variant="outline"
                                            onClick={() => privy.login?.()}
                                            disabled={!privy.ready}
                                        >
                                            sign in with privy
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === "handshake" && (
                            <div className="px-6 py-6 lg:px-12 lg:py-8 space-y-5">
                                <p className="text-sm text-muted-foreground">
                                    Run the initial handshake against your deployed {selectedStackData.label}
                                    endpoint to bind this runtime to your Privy-authenticated Sigil account.
                                </p>

                                <div className="border border-border bg-sage/15 px-4 py-4 sm:px-5 space-y-3">
                                    <p className="text-xs uppercase tracking-[0.12em] text-primary">
                                        one-click runtime launch
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Launch SigilBot on Railway from this screen with no manual endpoint entry.
                                        Runtime token is returned once.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={runOneClickRuntimeLaunch}
                                        disabled={!privy.authenticated || isQuickLaunching}
                                    >
                                        {isQuickLaunching ? "launching runtime..." : "launch sigilbot (1 click)"}
                                    </Button>
                                </div>

                                <div className="border border-border bg-background px-4 py-4 sm:px-5 space-y-3">
                                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                                        quick-launch claim secret
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        If you launched from hero quick-launch, redeem the one-time secret here, then
                                        update repo/details after claim.
                                    </p>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Input
                                            value={launchClaimToken}
                                            onChange={(event) => setLaunchClaimToken(event.target.value)}
                                            placeholder="sigil_claim_..."
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={redeemLaunchClaimToken}
                                            disabled={!launchClaimToken.trim()}
                                        >
                                            claim launch secret
                                        </Button>
                                    </div>
                                    {claimStatus && (
                                        <p className="text-xs text-muted-foreground">{claimStatus}</p>
                                    )}
                                    {claimedProjectId && (
                                        <div className="space-y-2 border border-border bg-sage/10 px-3 py-3">
                                            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                                update repo/details
                                            </p>
                                            <Input
                                                value={claimRepoUrl}
                                                onChange={(event) => setClaimRepoUrl(event.target.value)}
                                                placeholder="https://github.com/you/your-repo"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={updateClaimedProjectMetadata}
                                                disabled={!claimRepoUrl.trim()}
                                            >
                                                update claimed repo
                                            </Button>
                                            {claimUpdateStatus && (
                                                <p className="text-xs text-muted-foreground">{claimUpdateStatus}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="border border-border bg-[linear-gradient(180deg,hsl(var(--lavender)/0.18),hsl(var(--background)/0.96))]">
                                    <div className="border-border border-b px-4 py-3 sm:px-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <KeyRound className="size-4 text-primary" />
                                                <p className="text-xs uppercase tracking-[0.14em] text-primary">
                                                    mcp access token
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-[11px]">
                                                shown once
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Create a runtime PAT, then add it to your bot env as{" "}
                                            <code>SIGIL_MCP_TOKEN</code>.
                                        </p>
                                    </div>

                                    <div className="space-y-4 px-4 py-4 sm:px-5">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="connect-token-name"
                                                    className="text-xs uppercase tracking-wide text-muted-foreground"
                                                >
                                                    token label
                                                </label>
                                                <Input
                                                    id="connect-token-name"
                                                    value={tokenName}
                                                    onChange={(event) => setTokenName(event.target.value)}
                                                    placeholder="auto from runtime stack"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="connect-token-expiry"
                                                    className="text-xs uppercase tracking-wide text-muted-foreground"
                                                >
                                                    expires in days
                                                </label>
                                                <Input
                                                    id="connect-token-expiry"
                                                    type="number"
                                                    min={1}
                                                    max={365}
                                                    value={tokenExpiresInDays}
                                                    onChange={(event) =>
                                                        setTokenExpiresInDays(
                                                            Math.max(
                                                                1,
                                                                Math.min(
                                                                    365,
                                                                    Number.parseInt(event.target.value || "30", 10),
                                                                ),
                                                            ),
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                scope preset
                                            </p>
                                            <div className="grid gap-0 border border-border sm:grid-cols-2">
                                                {MCP_SCOPE_PRESETS.map((preset, index) => (
                                                    <button
                                                        key={preset.id}
                                                        type="button"
                                                        onClick={() => setScopePresetId(preset.id)}
                                                        className={cn(
                                                            "border-border px-3 py-3 text-left transition-colors",
                                                            index === 0 ? "border-b sm:border-b-0 sm:border-r" : "",
                                                            scopePresetId === preset.id
                                                                ? "bg-lavender/35"
                                                                : "bg-background hover:bg-sage/15",
                                                        )}
                                                    >
                                                        <p className="text-xs font-medium text-foreground">
                                                            {preset.label}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                                            {preset.description}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {tokenError && (
                                            <div className="border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                                                {tokenError}
                                            </div>
                                        )}

                                        {freshPat && (
                                            <div className="border border-border bg-background">
                                                <div className="border-border border-b px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                                    new token
                                                </div>
                                                <div className="px-3 py-3">
                                                    <code className="block break-all text-xs text-foreground">
                                                        {freshPat}
                                                    </code>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={copyFreshPat}
                                                            className="gap-1.5"
                                                        >
                                                            <Copy className="size-3.5" />
                                                            {patCopied ? "copied" : "copy token"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                onClick={createMcpTokenForProjects}
                                                disabled={!privy.authenticated || isCreatingToken}
                                            >
                                                {isCreatingToken ? "creating token..." : "create runtime pat"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => void fetchMcpTokens()}
                                                disabled={isLoadingTokens}
                                            >
                                                refresh token list
                                            </Button>
                                        </div>

                                        <div className="border border-border bg-background">
                                            <div className="border-border border-b px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                                active tokens
                                            </div>
                                            <div className="divide-y divide-border">
                                                {isLoadingTokens && (
                                                    <div className="px-3 py-3 text-xs text-muted-foreground">
                                                        loading tokens...
                                                    </div>
                                                )}
                                                {!isLoadingTokens && activeMcpTokens.length === 0 && (
                                                    <div className="px-3 py-3 text-xs text-muted-foreground">
                                                        no active MCP tokens yet.
                                                    </div>
                                                )}
                                                {activeMcpTokens.map((token) => (
                                                    <div key={token.id} className="px-3 py-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-medium text-foreground">
                                                                {token.name}
                                                            </p>
                                                            <Badge variant="outline" className="text-[10px]">
                                                                {token.scopes.length} scopes
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                                            {token.tokenPrefix}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="connect-endpoint"
                                            className="text-xs uppercase tracking-wide text-muted-foreground"
                                        >
                                            deployed endpoint
                                        </label>
                                        <Input
                                            id="connect-endpoint"
                                            value={endpoint}
                                            onChange={(event) => setEndpoint(event.target.value)}
                                            placeholder="https://your-bot.up.railway.app"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="connect-secret"
                                            className="text-xs uppercase tracking-wide text-muted-foreground"
                                        >
                                            connect secret (optional)
                                        </label>
                                        <Input
                                            id="connect-secret"
                                            value={secret}
                                            onChange={(event) => setSecret(event.target.value)}
                                            placeholder="x-sigil-connect-secret"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {error && (
                                        <div className="border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs text-red-800 dark:text-red-300">
                                            {error}
                                        </div>
                                    )}
                                    <Button
                                        onClick={runHandshake}
                                        disabled={!privy.authenticated || !endpoint || isChecking}
                                    >
                                        {isChecking ? "connecting..." : "run handshake"}
                                    </Button>
                                    <Button variant="outline" onClick={() => setStep("stack")}>
                                        back
                                    </Button>
                                </div>

                                {isConnected && (
                                    <div className="border border-border bg-sage/25 px-4 py-3 text-xs text-foreground">
                                        Handshake complete. Continue to configure prompts, tasks, and schedules.
                                    </div>
                                )}
                            </div>
                        )}

                        {step === "configure" && (
                            <div className="px-6 py-6 lg:px-12 lg:py-8 space-y-5">
                                <div className="grid gap-0 border border-border sm:grid-cols-3">
                                    <div className="border-border border-b sm:border-b-0 sm:border-r px-4 py-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <Clock3 className="size-4 text-primary" /> cron
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">3 active schedules</p>
                                    </div>
                                    <div className="border-border border-b sm:border-b-0 sm:border-r px-4 py-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <ListChecks className="size-4 text-primary" /> tasks
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">7 tracked todos</p>
                                    </div>
                                    <div className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <Sparkles className="size-4 text-primary" /> prompts
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">3 stage templates</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="connect-planner-prompt"
                                        className="text-xs uppercase tracking-wide text-muted-foreground"
                                    >
                                        planner stage prompt
                                    </label>
                                    <Textarea
                                        id="connect-planner-prompt"
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                        className="min-h-[120px]"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={() => setStep("run")}>continue</Button>
                                    <Button variant="outline" onClick={() => setStep("handshake")}>
                                        back
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "run" && (
                            <div className="px-6 py-6 lg:px-12 lg:py-8 space-y-5">
                                <p className="text-sm text-muted-foreground">
                                    Reuse the same chat orchestration already running on `/chat` so runtime
                                    execution stays consistent with Sigil app behavior.
                                </p>

                                <div className="grid gap-0 border border-border sm:grid-cols-2">
                                    <Link
                                        href="/chat"
                                        className="border-border border-b p-4 transition-colors hover:bg-sage/15 sm:border-b-0 sm:border-r"
                                    >
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <MessageSquareText className="size-4 text-primary" /> open chat
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            test prompts and inspect tool traces.
                                        </p>
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="p-4 transition-colors hover:bg-sage/15"
                                    >
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <Bot className="size-4 text-primary" /> open dashboard
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            monitor launch and wallet-linked progress.
                                        </p>
                                    </Link>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={() => setStep("manage")}>continue</Button>
                                    <Button variant="outline" onClick={() => setStep("configure")}>
                                        back
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "manage" && (
                            <div className="px-6 py-6 lg:px-12 lg:py-8 space-y-4">
                                <div className="space-y-2">
                                    {connectedBots.length === 0 && (
                                        <p className="text-sm text-muted-foreground py-4">
                                            No bots connected yet. Start by running a handshake.
                                        </p>
                                    )}
                                    {connectedBots.map((bot) => (
                                        <div
                                            key={bot.id}
                                            className="border border-border bg-background px-4 py-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {bot.stack} ({bot.id.slice(0, 8)})
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{bot.endpoint}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            bot.status === "connected" && "bg-sage/30",
                                                            bot.status === "disconnected" && "bg-lavender/35",
                                                        )}
                                                    >
                                                        {bot.status}
                                                    </Badge>
                                                    {bot.status === "connected" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs h-6"
                                                            onClick={() => disconnectBot(bot.id)}
                                                        >
                                                            disconnect
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="mt-2 text-[11px] text-muted-foreground">
                                                connected {bot.updatedAt}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" onClick={() => setStep("run")}>
                                        back
                                    </Button>
                                    <Button onClick={() => setStep("handshake")}>connect another bot</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside className="bg-sage/20">
                        <div className="px-6 py-5 border-border border-b bg-secondary/40">
                            <h3 className="text-sm font-medium text-foreground lowercase">fleet snapshot</h3>
                        </div>

                        <div className="divide-y divide-border">
                            {connectedBots.length === 0 && (
                                <div className="px-6 py-4">
                                    <p className="text-xs text-muted-foreground">No bots connected</p>
                                </div>
                            )}
                            {connectedBots.map((bot) => (
                                <div key={`aside-${bot.id}`} className="px-6 py-4">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="text-sm font-medium text-foreground">{bot.id.slice(0, 8)}</p>
                                        <div
                                            className={cn(
                                                "size-2",
                                                bot.status === "connected" ? "bg-green-500" : "bg-yellow-500",
                                            )}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{bot.stack}</p>
                                    <p className="text-[11px] text-muted-foreground">{bot.endpoint}</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-border border-t px-6 py-4 text-xs text-muted-foreground">
                            Current stack: <span className="text-foreground font-medium">{selectedStackData.label}</span>
                        </div>
                    </aside>
                </div>

                <div className="bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">prompt stages</h2>
                    </div>
                    <div className="grid md:grid-cols-3 border-border border-b">
                        {Object.entries(MOCK_PROMPT_STAGES).map(([stage, text], index) => (
                            <div
                                key={stage}
                                className={cn(
                                    "px-6 py-5 border-border",
                                    index < 2 && "md:border-r",
                                    index < 2 && "border-b md:border-b-0",
                                )}
                            >
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-2">
                                    {stage}
                                </p>
                                <p className="text-sm text-foreground">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
