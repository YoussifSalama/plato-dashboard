"use client";

import clsx from "clsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SortOrder = "asc" | "desc";

type SortOption = {
    key: string;
    value: SortOrder;
};

const formatKeyLabel = (key: string) => {
    if (key === "created_at") return "Creation Date";
    if (key === "updated_at") return "Update Date";
    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatOrderLabel = (order: SortOrder) =>
    order === "asc" ? "Ascending" : "Descending";

const SortingMenu = ({
    options,
    value,
    onChange,
    placeholder = "Sort by",
    triggerClassName,
}: {
    options: SortOption[];
    value?: SortOption;
    onChange: (key: string, value: SortOrder) => void;
    placeholder?: string;
    triggerClassName?: string;
}) => {
    const selectedValue = value ? `${value.key}:${value.value}` : undefined;

    return (
        <Select
            value={selectedValue}
            onValueChange={(next) => {
                const [key, order] = next.split(":");
                if (!key || (order !== "asc" && order !== "desc")) return;
                onChange(key, order);
            }}
        >
            <SelectTrigger
                className={clsx(
                    "w-full rounded-md border border-blue-200 bg-white p-2 text-blue-700 shadow-sm",
                    "focus-visible:border-blue-400 focus-visible:ring-blue-100 focus-visible:ring-2",
                    "dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-slate-700/60",
                    triggerClassName
                )}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => {
                    const optionValue = `${option.key}:${option.value}`;
                    return (
                        <SelectItem key={optionValue} value={optionValue}>
                            {formatKeyLabel(option.key)} {formatOrderLabel(option.value)}
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
};

export default SortingMenu;