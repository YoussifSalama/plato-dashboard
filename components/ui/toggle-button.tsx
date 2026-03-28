import * as React from "react";
import { cn } from "@/lib/utils";

type ToggleTone = "success" | "danger" | "neutral";
type ToggleValue = boolean | null;

type ToggleButtonProps = {
    label: string;
    value: ToggleValue;
    onChange: (next: ToggleValue) => void;
    tone?: ToggleTone;
    className?: string;
    trueLabel?: string;
    falseLabel?: string;
    anyLabel?: string;
};

const getNextValue = (value: ToggleValue) =>
    value === null ? true : value === true ? false : null;

const pillClasses = {
    success: {
        on: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
        off: "bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300",
    },
    danger: {
        on: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
        off: "bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300",
    },
    neutral: {
        on: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
        off: "bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300",
    },
};

const trackBase =
    "relative inline-flex h-5 w-10 items-center rounded-full transition";

const trackState = {
    any: "bg-slate-200 dark:bg-slate-700",
    on: "bg-emerald-500/70 dark:bg-emerald-500/60",
    off: "bg-slate-400/70 dark:bg-slate-600/70",
};

const knobBase =
    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition";

const knobTranslate = {
    any: "translate-x-3",
    on: "translate-x-5",
    off: "translate-x-1",
};

export function ToggleButton({
    label,
    value,
    onChange,
    tone = "neutral",
    className,
    trueLabel = "Yes",
    falseLabel = "No",
    anyLabel = "Off",
}: ToggleButtonProps) {
    const displayValue = value === null ? anyLabel : value ? trueLabel : falseLabel;
    const stateKey = value === null ? "any" : value ? "on" : "off";
    const pillState = value === null ? "off" : value ? "on" : "off";

    return (
        <button
            type="button"
            onClick={() => onChange(getNextValue(value))}
            className={cn(
                "inline-flex items-center gap-2 rounded-md border border-slate-200 p-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-800/70",
                className
            )}
        >
            <span>{label}</span>
            <span className={cn(trackBase, trackState[stateKey])}>
                <span className={cn(knobBase, knobTranslate[stateKey])} />
            </span>
            <span
                className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    pillClasses[tone][pillState]
                )}
            >
                {displayValue}
            </span>
        </button>
    );
}

