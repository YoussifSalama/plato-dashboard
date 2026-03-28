import { Input } from "@/components/ui/input";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

const SearchBar = ({
    hideSearchButton,
    placeholder,
    onChange,
    debounceMs = 300,
}: {
    hideSearchButton: boolean;
    placeholder: string;
    onChange: (value: string) => void;
    debounceMs?: number;
}) => {
    const [value, setValue] = useState("");
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const handle = setTimeout(() => {
            onChangeRef.current(value);
        }, debounceMs);
        return () => clearTimeout(handle);
    }, [value, debounceMs]);

    return (
        <div className={clsx("flex items-center gap-2")}>
            <Input
                type="search"
                id="search-input"
                className={clsx(
                    "w-full flex-2"
                )}
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            {!hideSearchButton && <button
                type="button"
                className={clsx(
                    "w-full rounded-md p-2 text-white transition-all duration-300 hover:scale-95",
                    "bg-linear-to-r from-[#009ad5] to-[#005ca9] shadow-sm shadow-blue-200/60 hover:from-[#009ad5] hover:to-[#005ca9] dark:shadow-none",
                    "flex-1"
                )}
                onClick={() => {
                    if (value.length > 0) {
                        onChangeRef.current(value);
                    } else {
                        // input focus
                        document.getElementById("search-input")?.focus();
                    }
                }}
            >
                Search
            </button>}
        </div>
    );
};

export default SearchBar;