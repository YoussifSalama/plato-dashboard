"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
    disabled?: boolean;
}

const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
    ({ checked, onChange, className, disabled }, ref) => {
        return (
            <div
                ref={ref}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    checked ? "bg-[#005CA9]" : "bg-slate-200 dark:bg-slate-700",
                    disabled ? "cursor-not-allowed opacity-50" : "opacity-100",
                    className
                )}
            >
                <motion.span
                    layout
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                    }}
                    className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0",
                        checked ? "ml-5" : "ml-1"
                    )}
                />
            </div>
        );
    }
);

Switch.displayName = "Switch";

export { Switch };
