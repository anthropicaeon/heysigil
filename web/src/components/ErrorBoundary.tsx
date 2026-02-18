"use client";

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child components.
 * Adapted for www design aesthetic.
 */

import React from "react";

import { Button } from "@/components/ui/button";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // eslint-disable-next-line no-console
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="flex items-center justify-center min-h-screen bg-cream">
                        <div className="flex flex-col items-center gap-4 p-8 text-center">
                            <div className="size-16 rounded-full bg-rose flex items-center justify-center">
                                <svg
                                    className="size-8 text-destructive"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">
                                Something went wrong
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                An unexpected error occurred. Please try refreshing the page.
                            </p>
                            <Button onClick={() => window.location.reload()}>Reload Page</Button>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
