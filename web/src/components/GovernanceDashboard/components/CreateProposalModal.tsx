/**
 * CreateProposalModal Component
 *
 * Modal form for creating new proposals.
 * Implements Cognitive Load Theory: smart defaults, inline validation, input assistance.
 */

"use client";

import { useState, useMemo } from "react";
import type { Proposal } from "../types";
import { formatNumberInput, parseNumberString } from "@/lib/format";

interface CreateProposalModalProps {
    onClose: () => void;
    onCreate: (p: Partial<Proposal>) => void;
}

// Smart default: 30 days from now
function getDefaultTargetDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
}

export function CreateProposalModal({ onClose, onCreate }: CreateProposalModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");
    const [targetDate, setTargetDate] = useState(getDefaultTargetDate());

    // Inline validation states
    const validation = useMemo(() => {
        const errors: Record<string, string | null> = {};

        // Title validation
        if (title && title.length < 5) {
            errors.title = "Title should be at least 5 characters";
        } else if (title && title.length > 100) {
            errors.title = "Title should be under 100 characters";
        }

        // Description validation
        if (description && description.length < 20) {
            errors.description = "Please provide more detail (at least 20 characters)";
        }

        // Token amount validation
        const amount = parseFloat(tokenAmount.replace(/,/g, ""));
        if (tokenAmount && (isNaN(amount) || amount <= 0)) {
            errors.tokenAmount = "Enter a valid positive number";
        }

        // Target date validation
        if (targetDate) {
            const target = new Date(targetDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (target < today) {
                errors.targetDate = "Target date must be in the future";
            }
        }

        return errors;
    }, [title, description, tokenAmount, targetDate]);

    const hasErrors = Object.values(validation).some((e) => e !== undefined && e !== null);
    const isValid = title && description && tokenAmount && targetDate && !hasErrors;

    // Format token amount with commas as user types
    const handleTokenAmountChange = (value: string) => {
        setTokenAmount(formatNumberInput(value));
    };

    const handleSubmit = () => {
        if (!isValid) return;
        onCreate({
            title,
            description,
            tokenAmount: tokenAmount.replace(/,/g, ""),
            targetDate: new Date(targetDate).getTime() / 1000,
        });
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <h2>Create Proposal</h2>

                {/* Title field */}
                <div className={`form-group ${validation.title ? "has-error" : title ? "has-success" : ""}`}>
                    <label htmlFor="proposal-title">Title</label>
                    <input
                        id="proposal-title"
                        type="text"
                        placeholder="e.g. Ship v2.0 — UI Redesign"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        autoFocus
                    />
                    {validation.title ? (
                        <p className="form-error">{validation.title}</p>
                    ) : (
                        <p className="form-hint">{title.length}/100 characters</p>
                    )}
                </div>

                {/* Description field */}
                <div className={`form-group ${validation.description ? "has-error" : description ? "has-success" : ""}`}>
                    <label htmlFor="proposal-description">Description</label>
                    <textarea
                        id="proposal-description"
                        placeholder="Describe the milestone, deliverables, and success criteria..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />
                    {validation.description ? (
                        <p className="form-error">{validation.description}</p>
                    ) : (
                        <p className="form-hint">Be specific about what you&apos;ll deliver and how the community can verify it.</p>
                    )}
                </div>

                {/* Token amount field with formatting */}
                <div className={`form-group ${validation.tokenAmount ? "has-error" : tokenAmount ? "has-success" : ""}`}>
                    <label htmlFor="proposal-amount">Token Amount</label>
                    <div className="input-with-suffix">
                        <input
                            id="proposal-amount"
                            type="text"
                            inputMode="numeric"
                            placeholder="1,000,000"
                            value={tokenAmount}
                            onChange={(e) => handleTokenAmountChange(e.target.value)}
                        />
                        <span className="input-suffix">tokens</span>
                    </div>
                    {validation.tokenAmount ? (
                        <p className="form-error">{validation.tokenAmount}</p>
                    ) : (
                        <p className="form-hint">Number of tokens to unlock upon completion.</p>
                    )}
                </div>

                {/* Target date with smart default */}
                <div className={`form-group ${validation.targetDate ? "has-error" : targetDate ? "has-success" : ""}`}>
                    <label htmlFor="proposal-date">Target Completion Date</label>
                    <input
                        id="proposal-date"
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                    />
                    {validation.targetDate ? (
                        <p className="form-error">{validation.targetDate}</p>
                    ) : (
                        <p className="form-hint">Default: 30 days from today. Adjust as needed.</p>
                    )}
                </div>

                <div className="form-actions">
                    <button className="btn-secondary" onClick={onClose} type="button">
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={!isValid}
                        type="button"
                    >
                        Submit Proposal
                    </button>
                </div>
            </div>
        </div>
    );
}
