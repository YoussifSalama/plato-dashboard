"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";
import { warningToast } from "@/shared/helper/toast";

export type SkillOption = { label: string; value: string };

interface SkillTagInputProps {
    label: string;
    icon?: ReactNode;
    iconClassName?: string;
    values: string[];
    onChange: (values: string[]) => void;
    options: SkillOption[];
    placeholder: string;
    allowCustom: boolean;
    hint?: string;
}

const SkillTagInput = ({
    label,
    icon,
    iconClassName,
    values,
    onChange,
    options,
    placeholder,
    allowCustom,
    hint,
}: SkillTagInputProps) => {
    const [inputValue, setInputValue] = useState("");
    const [open, setOpen] = useState(false);

    const filteredOptions = useMemo(() => {
        const term = inputValue.trim().toLowerCase();
        if (!term) return options;
        return options.filter((option) =>
            `${option.label} ${option.value}`.toLowerCase().includes(term)
        );
    }, [inputValue, options]);

    const resolveOptionValue = (raw: string) => {
        const normalized = raw.trim().toLowerCase();
        if (!normalized) return "";
        const match = options.find(
            (option) =>
                option.value.toLowerCase() === normalized ||
                option.label.toLowerCase() === normalized
        );
        if (match) return match.value;
        return allowCustom ? raw.trim() : "";
    };

    const addValue = (raw: string) => {
        const value = resolveOptionValue(raw);
        if (!value) {
            warningToast("Please select a valid option from the list.");
            return;
        }
        if (values.includes(value)) {
            setInputValue("");
            return;
        }
        onChange([...values, value]);
        setInputValue("");
    };

    const removeValue = (value: string) => {
        onChange(values.filter((item) => item !== value));
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                    {icon && <span className={iconClassName}>{icon}</span>}
                    {label}
                </span>
            </label>
            <div className="relative">
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-blue-100 bg-white px-3 py-2 text-sm shadow-xs dark:border-slate-700/60 dark:bg-slate-900">
                    {values.map((value) => {
                        const optionLabel =
                            options.find((option) => option.value === value)?.label ?? value;
                        return (
                            <span
                                key={value}
                                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {optionLabel}
                                <button
                                    type="button"
                                    onClick={() => removeValue(value)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-slate-300"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                    <input
                        className="min-w-[160px] flex-1 bg-transparent outline-none"
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={(event) => {
                            setInputValue(event.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        onBlur={() => {
                            setTimeout(() => setOpen(false), 120);
                            if (allowCustom && inputValue.trim()) {
                                addValue(inputValue);
                            }
                        }}
                        onKeyDown={(event) => {
                            if (["Enter", "Tab", ","].includes(event.key)) {
                                event.preventDefault();
                                addValue(inputValue);
                            }
                            if (event.key === "Backspace" && !inputValue && values.length) {
                                removeValue(values[values.length - 1]);
                            }
                        }}
                    />
                </div>
                {open && filteredOptions.length > 0 && (
                    <div className="absolute z-20 mt-2 max-h-[30vh] w-full overflow-y-auto rounded-md border border-blue-100 bg-white p-2 shadow-lg dark:border-slate-700/60 dark:bg-slate-900">
                        {filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    addValue(option.value);
                                    setOpen(false);
                                }}
                                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-800"
                            >
                                <span>{option.label}</span>
                                {values.includes(option.value) && (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-500">{hint ?? "Use comma or Tab to add tags."}</p>
        </div>
    );
};

export default SkillTagInput;

