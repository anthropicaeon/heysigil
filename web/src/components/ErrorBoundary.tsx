"use client";

import React from "react";

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
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100vh",
                        fontFamily: "system-ui, sans-serif",
                        flexDirection: "column",
                        gap: "12px",
                    }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 500 }}>Something went wrong</h2>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                                background: "#482863",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "14px",
                            }}
                        >
                            Reload
                        </button>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
