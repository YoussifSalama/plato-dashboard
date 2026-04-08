"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import clsx from "clsx";

type ComboboxOption = {
    label: string;
    value: string;
};

type ComboboxProps = {
    value?: string;
    onChange: (value: string) => void;
    options: ComboboxOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    disabled?: boolean;
    onSearch?: (term: string) => void;
};

const Combobox = ({
    value,
    onChange,
    options,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyLabel = "No results found.",
    disabled,
    onSearch,
}: ComboboxProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const onSearchRef = useRef<ComboboxProps["onSearch"]>(onSearch);

    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);
    const selectedLabel = useMemo(
        () => options.find((option) => option.value === value)?.label,
        [options, value]
    );
    const filteredOptions = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return options;
        return options.filter((option) =>
            `${option.label} ${option.value}`.toLowerCase().includes(term)
        );
    }, [options, search]);

    useEffect(() => {
        if (!open || !onSearchRef.current) return;
        const id = setTimeout(() => {
            onSearchRef.current?.(search);
        }, 250);
        return () => clearTimeout(id);
    }, [open, search]);

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setSearch("");
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    role="combobox"
                    aria-expanded={open}
                    className={clsx(
                        "w-full justify-between font-normal",
                        !value && "text-slate-500 dark:text-slate-400"
                    )}
                >
                    {selectedLabel ?? placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 pointer-events-auto">
                <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700/60">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-9 pl-8"
                        />
                    </div>
                </div>
                <div className="max-h-[260px] overflow-y-auto p-1">
                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            {emptyLabel}
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                    setSearch("");
                                }}
                                className={clsx(
                                    "flex w-full items-center rounded-md px-2 py-2 text-left text-sm",
                                    "hover:bg-slate-100 hover:text-slate-900",
                                    "dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                                )}
                            >
                                <Check
                                    className={clsx(
                                        "mr-2 h-4 w-4",
                                        option.value === value
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default Combobox;

