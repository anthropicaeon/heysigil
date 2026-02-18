"use client";

/**
 * LoadingButton Component
 *
 * Button with built-in loading state and spinner.
 * Adapted for www design aesthetic using Tailwind and shadcn patterns.
 */

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends Omit<ButtonProps, "children"> {
    loading: boolean;
    children: ReactNode;
    loadingText?: string;
}

export function LoadingButton({
    loading,
    children,
    loadingText = "Loading...",
    disabled,
    className,
    ...props
}: LoadingButtonProps) {
    return (
        <Button disabled={disabled || loading} className={cn(className)} {...props}>
            {loading ? (
                <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </Button>
    );
}
