import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "border-border file:text-foreground placeholder:text-muted-foreground flex h-11 w-full border bg-background px-4 py-2 text-base transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-primary focus:bg-primary/5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    className,
                )}
                ref={ref}
                {...props}
            />
        );
    },
);
Input.displayName = "Input";

export { Input };
