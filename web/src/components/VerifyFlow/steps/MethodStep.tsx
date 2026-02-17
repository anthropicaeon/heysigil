/**
 * MethodStep Component
 *
 * Step 1: Choose verification method.
 * Implements Hick's Law: Show 3 recommended methods prominently,
 * collapse others under "More options" to reduce decision paralysis.
 */

"use client";

import { useState } from "react";
import type { Method } from "../types";
import { RECOMMENDED_METHODS, OTHER_METHODS } from "../constants";

interface MethodStepProps {
    selectedMethod: Method | null;
    onSelect: (method: Method) => void;
    onContinue: () => void;
}

export function MethodStep({ selectedMethod, onSelect, onContinue }: MethodStepProps) {
    const [showMore, setShowMore] = useState(false);

    // If user already selected a non-recommended method, keep expanded
    const expandedByDefault = selectedMethod !== null && OTHER_METHODS.some((m) => m.id === selectedMethod.id);

    return (
        <div>
            <h2 style={{ marginBottom: "var(--space-2)" }}>Choose Verification Method</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
                Pick the method that works best for you. Most developers use GitHub OAuth.
            </p>

            {/* Recommended methods (Hick's Law: show 3 prominent choices) */}
            <div className="method-grid method-grid-recommended">
                {RECOMMENDED_METHODS.map((m) => (
                    <label
                        key={m.id}
                        className={`method-option method-option-recommended ${selectedMethod?.id === m.id ? "selected" : ""}`}
                    >
                        <input
                            type="radio"
                            name="method"
                            checked={selectedMethod?.id === m.id}
                            onChange={() => onSelect(m)}
                        />
                        <div className="method-info">
                            <div className="method-header">
                                <h4>{m.name}</h4>
                                {m.badge && <span className="method-badge">{m.badge}</span>}
                            </div>
                            <p>{m.description}</p>
                            {m.popularity && (
                                <span className="method-popularity">{m.popularity}% of developers use this</span>
                            )}
                        </div>
                    </label>
                ))}
            </div>

            {/* More options toggle (Progressive Disclosure) */}
            <div className="method-more-toggle">
                <button
                    type="button"
                    className="method-more-btn"
                    onClick={() => setShowMore(!showMore)}
                    aria-expanded={showMore || expandedByDefault}
                >
                    <span>{showMore || expandedByDefault ? "Hide" : "Show"} {OTHER_METHODS.length} more options</span>
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{
                            transform: showMore || expandedByDefault ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform var(--duration) var(--ease)",
                        }}
                    >
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {/* Additional methods (collapsed by default) */}
            {(showMore || expandedByDefault) && (
                <div className="method-grid method-grid-other">
                    {OTHER_METHODS.map((m) => (
                        <label
                            key={m.id}
                            className={`method-option ${selectedMethod?.id === m.id ? "selected" : ""}`}
                        >
                            <input
                                type="radio"
                                name="method"
                                checked={selectedMethod?.id === m.id}
                                onChange={() => onSelect(m)}
                            />
                            <div className="method-info">
                                <h4>{m.name}</h4>
                                <p>{m.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            )}

            <div style={{ marginTop: "var(--space-6)" }}>
                <button
                    type="button"
                    className="btn-primary btn-lg"
                    disabled={!selectedMethod}
                    onClick={onContinue}
                    style={{ width: "100%" }}
                >
                    Continue with {selectedMethod?.name || "selected method"}
                </button>
            </div>
        </div>
    );
}
