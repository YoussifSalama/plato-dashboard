"use client";

import clsx from "clsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const RecommendationFilter = ({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (value: string | null) => void;
}) => {
    return (
        <Select
            value={value ?? "all"}
            onValueChange={(nextValue) =>
                onChange(nextValue === "all" ? null : nextValue)
            }
        >
            <SelectTrigger
                className={clsx(
                    "w-full rounded-md border border-blue-200 bg-white p-2 text-blue-700 shadow-sm",
                    "focus-visible:border-blue-400 focus-visible:ring-blue-100 focus-visible:ring-2",
                    "dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-slate-700/60",
                )}
            >
                <SelectValue placeholder="Recommendation" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All recommendations</SelectItem>
                <SelectItem value="highly_recommended">Highly Recommended</SelectItem>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="consider">Consider</SelectItem>
                <SelectItem value="not_recommended">Not Recommended</SelectItem>
            </SelectContent>
        </Select>
    );
};

export default RecommendationFilter;

