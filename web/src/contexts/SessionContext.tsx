"use client";

/**
 * Session Context
 *
 * Provides session state (sessionId) to all components.
 * Integrates with Privy for authenticated users.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";

interface SessionState {
    /** The effective session ID (Privy user ID or local session ID) */
    sessionId: string | null;
    /** Set a local session ID (for unauthenticated users) */
    setSessionId: (id: string) => void;
    /** Whether the user is authenticated via Privy */
    isAuthenticated: boolean;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [localSessionId, setLocalSessionId] = useState<string | null>(null);
    const privy = useOptionalPrivy();

    const isAuthenticated = privy?.authenticated ?? false;
    const privyUserId = privy?.user?.id ?? null;

    // Use Privy user ID when authenticated, otherwise use local session
    const sessionId = privyUserId || localSessionId;

    return (
        <SessionContext.Provider
            value={{
                sessionId,
                setSessionId: setLocalSessionId,
                isAuthenticated,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}

/**
 * Get the current session state.
 * Must be used within a SessionProvider.
 */
export function useSession(): SessionState {
    const ctx = useContext(SessionContext);
    if (!ctx) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return ctx;
}

/**
 * Get the session state, or null if outside provider.
 * Safe to use when provider may not be present.
 */
export function useSessionSafe(): SessionState | null {
    return useContext(SessionContext);
}
