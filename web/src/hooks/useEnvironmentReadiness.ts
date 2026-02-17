"use client";

import { useEffect, useState } from "react";

type CheckStatus = "ok" | "warn" | "error" | "checking";

export interface EnvironmentCheck {
    key: string;
    label: string;
    status: CheckStatus;
    detail: string;
}

interface ReadinessState {
    loading: boolean;
    checks: EnvironmentCheck[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function defaultChecks(): EnvironmentCheck[] {
    return [
        { key: "frontend-privy", label: "Frontend Privy", status: "checking", detail: "Checking..." },
        { key: "backend-health", label: "Backend API", status: "checking", detail: "Checking..." },
        { key: "backend-auth", label: "Backend auth", status: "checking", detail: "Checking..." },
        { key: "backend-db", label: "Backend DB endpoints", status: "checking", detail: "Checking..." },
    ];
}

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const json = (await response.json()) as { error?: string };
        return json.error || `HTTP ${response.status}`;
    } catch {
        return `HTTP ${response.status}`;
    }
}

export function useEnvironmentReadiness(): ReadinessState {
    const isDev = process.env.NODE_ENV !== "production";
    const [state, setState] = useState<ReadinessState>({
        loading: isDev,
        checks: defaultChecks(),
    });

    useEffect(() => {
        if (!isDev) {
            setState({ loading: false, checks: [] });
            return;
        }

        let cancelled = false;

        async function runChecks() {
            const checks = defaultChecks();

            const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
            checks[0] = privyAppId
                ? {
                      key: "frontend-privy",
                      label: "Frontend Privy",
                      status: "ok",
                      detail: "Configured via NEXT_PUBLIC_PRIVY_APP_ID.",
                  }
                : {
                      key: "frontend-privy",
                      label: "Frontend Privy",
                      status: "warn",
                      detail: "Missing NEXT_PUBLIC_PRIVY_APP_ID (sign-in/wallet connect UI disabled).",
                  };

            let backendHealthy = false;

            try {
                const health = await fetch(`${API_BASE}/health`);
                if (health.ok) {
                    backendHealthy = true;
                    checks[1] = {
                        key: "backend-health",
                        label: "Backend API",
                        status: "ok",
                        detail: `Reachable at ${API_BASE}.`,
                    };
                } else {
                    checks[1] = {
                        key: "backend-health",
                        label: "Backend API",
                        status: "error",
                        detail: `Health check failed (${await readErrorMessage(health)}).`,
                    };
                }
            } catch {
                checks[1] = {
                    key: "backend-health",
                    label: "Backend API",
                    status: "error",
                    detail: `Cannot reach ${API_BASE}. Start backend or update NEXT_PUBLIC_API_URL.`,
                };
            }

            if (backendHealthy) {
                try {
                    const auth = await fetch(`${API_BASE}/api/verify?limit=1&offset=0`);
                    if (auth.status === 401) {
                        checks[2] = {
                            key: "backend-auth",
                            label: "Backend auth",
                            status: "ok",
                            detail: "Privy auth middleware is active.",
                        };
                    } else if (auth.status === 503) {
                        const msg = await readErrorMessage(auth);
                        checks[2] = {
                            key: "backend-auth",
                            label: "Backend auth",
                            status: "warn",
                            detail:
                                msg.includes("Authentication service unavailable")
                                    ? "Missing PRIVY_APP_ID / PRIVY_APP_SECRET in backend .env."
                                    : `Auth check returned 503 (${msg}).`,
                        };
                    } else {
                        checks[2] = {
                            key: "backend-auth",
                            label: "Backend auth",
                            status: "warn",
                            detail: `Unexpected auth response (HTTP ${auth.status}).`,
                        };
                    }
                } catch {
                    checks[2] = {
                        key: "backend-auth",
                        label: "Backend auth",
                        status: "warn",
                        detail: "Could not run auth readiness check.",
                    };
                }

                try {
                    const db = await fetch(`${API_BASE}/api/fees/distributions?limit=1&offset=0`);
                    if (db.ok) {
                        checks[3] = {
                            key: "backend-db",
                            label: "Backend DB endpoints",
                            status: "ok",
                            detail: "Fee/distribution DB endpoint responds.",
                        };
                    } else if (db.status === 503) {
                        const msg = await readErrorMessage(db);
                        checks[3] = {
                            key: "backend-db",
                            label: "Backend DB endpoints",
                            status: "error",
                            detail:
                                msg.includes("Database not configured")
                                    ? "Missing DATABASE_URL in backend .env."
                                    : `DB endpoint unavailable (${msg}).`,
                        };
                    } else {
                        checks[3] = {
                            key: "backend-db",
                            label: "Backend DB endpoints",
                            status: "warn",
                            detail: `Unexpected DB endpoint response (HTTP ${db.status}).`,
                        };
                    }
                } catch {
                    checks[3] = {
                        key: "backend-db",
                        label: "Backend DB endpoints",
                        status: "warn",
                        detail: "Could not run DB readiness check.",
                    };
                }
            } else {
                checks[2] = {
                    key: "backend-auth",
                    label: "Backend auth",
                    status: "warn",
                    detail: "Skipped because backend is not reachable.",
                };
                checks[3] = {
                    key: "backend-db",
                    label: "Backend DB endpoints",
                    status: "warn",
                    detail: "Skipped because backend is not reachable.",
                };
            }

            if (!cancelled) {
                setState({ loading: false, checks });
            }
        }

        void runChecks();

        return () => {
            cancelled = true;
        };
    }, [isDev]);

    return state;
}
