"use client";

import clsx from "clsx";

const LoadingEllipsis = ({ className }: { className?: string }) => {
    return (
        <span
            className={clsx("inline-flex items-center gap-0.5 text-slate-500", className)}
            aria-hidden="true"
        >
            <span className="animate-bounce [animation-delay:-0.2s]">.</span>
            <span className="animate-bounce [animation-delay:-0.1s]">.</span>
            <span className="animate-bounce">.</span>
        </span>
    );
};

export default LoadingEllipsis;

