"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const SectionCard = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <section className={cn("rounded-3xl border border-resume-border bg-resume-surface p-6 md:p-8", className)}>
        {children}
    </section>
);

export const SectionHeader = ({
    icon: Icon,
    title,
    subtitle,
    iconClassName,
}: {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    iconClassName?: string;
}) => (
    <div className="mb-5 flex items-center gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl bg-resume-surface-soft", iconClassName)}>
            <Icon className="h-5 w-5 text-resume-primary" />
        </div>
        <div>
            <h3 className="text-lg font-bold text-resume-text-strong">{title}</h3>
            {subtitle ? <p className="text-sm text-resume-text-muted">{subtitle}</p> : null}
        </div>
    </div>
);

export const MetaPill = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span
        className={cn(
            "inline-flex items-center rounded-xl border border-resume-border bg-resume-surface-soft px-3 py-1 text-xs font-semibold text-resume-text-strong",
            className,
        )}
    >
        {children}
    </span>
);

export const StatCard = ({
    label,
    value,
    className,
}: {
    label: string;
    value: number;
    className?: string;
}) => (
    <div className={cn("rounded-2xl border border-resume-border p-4 text-center", className)}>
        <p className="text-3xl font-black text-resume-text-strong">{value}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-resume-text-muted">{label}</p>
    </div>
);

export const EmptyStateText = ({ text }: { text: string }) => (
    <p className="text-sm text-resume-text-muted">{text}</p>
);
