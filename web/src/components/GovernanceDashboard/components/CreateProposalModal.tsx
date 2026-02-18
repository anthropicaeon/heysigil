/**
 * CreateProposalModal Component
 *
 * Modal form for creating new proposals.
 * Implements Cognitive Load Theory: smart defaults, inline validation, input assistance.
 * Updated with pastel design system.
 */

"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { Proposal } from "../types";

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

// Format number with commas
function formatNumberInput(value: string): string {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function CreateProposalModal({ onClose, onCreate }: CreateProposalModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");
    const [targetDate, setTargetDate] = useState(getDefaultTargetDate());

    // Inline validation states
    const validation = useMemo(() => {
        const errors: Record<string, string | null> = {};

        if (title && title.length < 5) {
            errors.title = "Title should be at least 5 characters";
        } else if (title && title.length > 100) {
            errors.title = "Title should be under 100 characters";
        }

        if (description && description.length < 20) {
            errors.description = "Please provide more detail (at least 20 characters)";
        }

        const amount = parseFloat(tokenAmount.replace(/,/g, ""));
        if (tokenAmount && (isNaN(amount) || amount <= 0)) {
            errors.tokenAmount = "Enter a valid positive number";
        }

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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-background border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-border border-b">
                    <h2 className="text-lg font-semibold text-foreground lowercase">
                        create proposal
                    </h2>
                    <Button variant="ghost" size="icon-sm" onClick={onClose}>
                        <X className="size-4" />
                    </Button>
                </div>

                {/* Form */}
                <div className="px-6 py-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label
                            htmlFor="proposal-title"
                            className="text-sm font-medium text-foreground block mb-2"
                        >
                            Title
                        </label>
                        <Input
                            id="proposal-title"
                            placeholder="e.g. Ship v2.0 — UI Redesign"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            className={cn(validation.title && "border-red-500")}
                        />
                        {validation.title ? (
                            <p className="text-xs text-red-500 mt-1">{validation.title}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                                {title.length}/100 characters
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="proposal-description"
                            className="text-sm font-medium text-foreground block mb-2"
                        >
                            Description
                        </label>
                        <Textarea
                            id="proposal-description"
                            placeholder="Describe the milestone, deliverables, and success criteria..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className={cn(validation.description && "border-red-500")}
                        />
                        {validation.description ? (
                            <p className="text-xs text-red-500 mt-1">{validation.description}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                                Be specific about what you'll deliver and how the community can
                                verify it.
                            </p>
                        )}
                    </div>

                    {/* Token Amount */}
                    <div>
                        <label
                            htmlFor="proposal-amount"
                            className="text-sm font-medium text-foreground block mb-2"
                        >
                            Token Amount
                        </label>
                        <div className="relative">
                            <Input
                                id="proposal-amount"
                                inputMode="numeric"
                                placeholder="1,000,000"
                                value={tokenAmount}
                                onChange={(e) => handleTokenAmountChange(e.target.value)}
                                className={cn("pr-16", validation.tokenAmount && "border-red-500")}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                tokens
                            </span>
                        </div>
                        {validation.tokenAmount ? (
                            <p className="text-xs text-red-500 mt-1">{validation.tokenAmount}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                                Number of tokens to unlock upon completion.
                            </p>
                        )}
                    </div>

                    {/* Target Date */}
                    <div>
                        <label
                            htmlFor="proposal-date"
                            className="text-sm font-medium text-foreground block mb-2"
                        >
                            Target Completion Date
                        </label>
                        <Input
                            id="proposal-date"
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className={cn(validation.targetDate && "border-red-500")}
                        />
                        {validation.targetDate ? (
                            <p className="text-xs text-red-500 mt-1">{validation.targetDate}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                                Default: 30 days from today. Adjust as needed.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-border border-t bg-sage/30">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
                        Submit Proposal
                    </Button>
                </div>
            </div>
        </div>
    );
}
