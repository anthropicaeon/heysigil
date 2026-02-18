import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "border-border placeholder:text-muted-foreground flex min-h-[100px] w-full border bg-background px-4 py-3 text-base transition-all duration-200 focus:border-primary focus:bg-primary/5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    className,
                )}
                ref={ref}
                {...props}
            />
        );
    },
);
Textarea.displayName = "Textarea";

export { Textarea };
