"use client";

import {
    Activity,
    Bot,
    CheckCircle,
    Clock3,
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
    status: "connected" | "degraded";
    activeTasks: number;
    updatedAt: string;
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

// TODO(connect-data): Replace with /api/connect/bots after handshake persistence lands.
const MOCK_CONNECTED_BOTS: ConnectedBot[] = [
    {
        id: "bot_01",
        stack: "sigilbot",
        endpoint: "https://sigilbot-prod.up.railway.app",
        status: "connected",
        activeTasks: 4,
        updatedAt: "2m ago",
    },
    {
        id: "bot_02",
        stack: "openclaw",
        endpoint: "https://openclaw-agent.up.railway.app",
        status: "degraded",
        activeTasks: 1,
        updatedAt: "11m ago",
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

    const stepIndex = useMemo(() => STEP_SEQUENCE.indexOf(step), [step]);
    const selectedStackData = STACKS.find((item) => item.id === selectedStack) ?? STACKS[0];
    const isDev = process.env.NODE_ENV === "development";

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

    function runHandshakeMock() {
        setIsChecking(true);
        window.setTimeout(() => {
            setIsChecking(false);
            setIsConnected(true);
            setStep("configure");
        }, 800);
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
                                    {MOCK_CONNECTED_BOTS.length} connected instances (mock)
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

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-wide text-muted-foreground">
                                            deployed endpoint
                                        </label>
                                        <Input
                                            value={endpoint}
                                            onChange={(event) => setEndpoint(event.target.value)}
                                            placeholder="https://your-bot.up.railway.app"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-wide text-muted-foreground">
                                            connect secret (optional)
                                        </label>
                                        <Input
                                            value={secret}
                                            onChange={(event) => setSecret(event.target.value)}
                                            placeholder="x-sigil-connect-secret"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={runHandshakeMock}
                                        disabled={!privy.authenticated || !endpoint || isChecking}
                                    >
                                        {isChecking ? "checking..." : "run handshake"}
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
                                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                                        planner stage prompt
                                    </label>
                                    <Textarea
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
                                    {MOCK_CONNECTED_BOTS.map((bot) => (
                                        <div
                                            key={bot.id}
                                            className="border border-border bg-background px-4 py-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {bot.stack} ({bot.id})
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{bot.endpoint}</p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        bot.status === "connected" && "bg-sage/30",
                                                        bot.status === "degraded" && "bg-lavender/35",
                                                    )}
                                                >
                                                    {bot.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-2 text-[11px] text-muted-foreground">
                                                {bot.activeTasks} tasks, updated {bot.updatedAt}
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
                            {MOCK_CONNECTED_BOTS.map((bot) => (
                                <div key={`aside-${bot.id}`} className="px-6 py-4">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="text-sm font-medium text-foreground">{bot.id}</p>
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
