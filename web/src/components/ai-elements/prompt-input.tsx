"use client";

/**
 * Prompt Input Components
 *
 * Chat input with suggestions and submit button, border-centric design.
 */

import { ArrowUp } from "lucide-react";
import type { FormEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Loader } from "./loader";

interface PromptInputProps {
    children: ReactNode;
    onSubmit: (message: unknown, e: FormEvent) => void;
    className?: string;
}

export function PromptInput({ children, onSubmit, className }: PromptInputProps) {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(null, e);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn("border-border border-t bg-background", className)}
        >
            {children}
        </form>
    );
}

interface PromptInputTextareaProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function PromptInputTextarea({
    value,
    onChange,
    placeholder = "Type your message...",
    className,
    disabled,
}: PromptInputTextareaProps) {
    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
                "w-full min-h-[56px] max-h-40 resize-none bg-transparent px-6 py-4 lg:px-12 text-base placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                }
            }}
        />
    );
}

interface PromptInputToolbarProps {
    children: ReactNode;
    className?: string;
}

export function PromptInputToolbar({ children, className }: PromptInputToolbarProps) {
    return (
        <div
            className={cn(
                "flex items-center px-6 py-3 lg:px-12 border-border border-t bg-secondary/20",
                className,
            )}
        >
            {children}
        </div>
    );
}

interface PromptInputToolsProps {
    children: ReactNode;
    className?: string;
}

export function PromptInputTools({ children, className }: PromptInputToolsProps) {
    return <div className={cn("flex items-center gap-3", className)}>{children}</div>;
}

interface PromptInputSubmitProps {
    disabled?: boolean;
    status?: "ready" | "streaming" | "submitted";
    className?: string;
}

export function PromptInputSubmit({ disabled, status, className }: PromptInputSubmitProps) {
    const isLoading = status === "streaming" || status === "submitted";

    return (
        <button
            type="submit"
            disabled={disabled || isLoading}
            className={cn(
                "size-10 flex items-center justify-center border border-border bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                className,
            )}
        >
            {isLoading ? <Loader className="size-4" /> : <ArrowUp className="size-5" />}
        </button>
    );
}
