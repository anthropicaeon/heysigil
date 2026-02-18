import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                // Primary - Purple brand color, main CTAs
                default:
                    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95 border border-primary",
                // Destructive - Red for dangerous actions
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 border border-destructive",
                // Outline - Border only, transparent bg
                outline:
                    "border border-border bg-transparent text-foreground hover:bg-secondary/50 hover:border-primary/30 active:bg-secondary/70",
                // Secondary - Sage pastel background
                secondary:
                    "bg-sage text-foreground border border-sage hover:bg-sage/80 active:bg-sage/90",
                // Ghost - Minimal, no border until hover
                ghost: "text-foreground hover:bg-secondary/50 hover:text-foreground active:bg-secondary/70",
                // Link - Text link style
                link: "text-primary underline-offset-4 hover:underline font-medium p-0 h-auto",
                // Soft - Lavender pastel, softer feel
                soft: "bg-lavender text-foreground border border-lavender hover:bg-lavender/80 active:bg-lavender/90",
                // Muted - Cream background, subtle
                muted: "bg-cream text-foreground border border-cream hover:bg-cream/80 active:bg-cream/90",
                // Toggle - For theme/settings toggles
                toggle: "border border-border bg-transparent text-foreground hover:bg-lavender/50 hover:text-primary active:bg-lavender/70",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-8 px-3 py-1.5 text-xs",
                lg: "h-12 px-8 py-3 text-base",
                xl: "h-14 px-10 py-4 text-base font-semibold",
                icon: "size-10",
                "icon-sm": "size-8",
                link: "h-auto p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
