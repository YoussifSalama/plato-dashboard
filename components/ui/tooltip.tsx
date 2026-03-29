"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "left" | "right";

type TooltipProps = {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    side?: TooltipSide;
};

const Tooltip = ({
    content,
    children,
    className,
    contentClassName,
    side = "top",
}: TooltipProps) => {
    const triggerRef = React.useRef<HTMLSpanElement>(null);
    const [open, setOpen] = React.useState(false);
    const [position, setPosition] = React.useState({ top: 0, left: 0, transform: "" });

    const updatePosition = React.useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const offset = 8;
        if (side === "top") {
            setPosition({
                top: rect.top - offset,
                left: rect.left + rect.width / 2,
                transform: "translate(-50%, -100%)",
            });
            return;
        }
        if (side === "bottom") {
            setPosition({
                top: rect.bottom + offset,
                left: rect.left + rect.width / 2,
                transform: "translate(-50%, 0)",
            });
            return;
        }
        if (side === "left") {
            setPosition({
                top: rect.top + rect.height / 2,
                left: rect.left - offset,
                transform: "translate(-100%, -50%)",
            });
            return;
        }
        setPosition({
            top: rect.top + rect.height / 2,
            left: rect.right + offset,
            transform: "translate(0, -50%)",
        });
    }, [side]);

    React.useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open, updatePosition, content]);

    React.useEffect(() => {
        if (!open) return;
        const handleScroll = () => updatePosition();
        const handleResize = () => updatePosition();
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
        };
    }, [open, updatePosition]);

    if (!content) return <>{children}</>;
    const tooltip = open ? (
        <span
            role="tooltip"
            style={{ top: position.top, left: position.left, transform: position.transform }}
            className={cn(
                "pointer-events-none fixed z-100 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-md shadow-black/20",
                "dark:bg-slate-100 dark:text-slate-900",
                contentClassName
            )}
        >
            {content}
        </span>
    ) : null;

    return (
        <span
            ref={triggerRef}
            className={cn("inline-flex", className)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            {children}
            {typeof document !== "undefined" && tooltip
                ? createPortal(tooltip, document.body)
                : null}
        </span>
    );
};

export { Tooltip };

