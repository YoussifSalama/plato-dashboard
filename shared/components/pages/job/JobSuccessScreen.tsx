"use client";

import { CheckCircle2, Briefcase, Eye, Pencil, Share2, ChevronRight, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface JobSuccessScreenProps {
    jobId?: string;
    jobTitle: string;
    jobType: string;
    location: string;
    salaryFrom?: number;
    salaryTo?: number;
    salaryCurrency?: string;
    onPostAnother: () => void;
}

const formatSalary = (from?: number, to?: number, currency?: string) => {
    if (!from && !to) return null;
    const fmt = (n: number) => {
        if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
        return String(n);
    };
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : (currency ?? "");
    if (from && to) return `${symbol}${fmt(from)} - ${symbol}${fmt(to)}`;
    if (from) return `${symbol}${fmt(from)}+`;
    return `Up to ${symbol}${fmt(to!)}`;
};

const JobSuccessScreen = ({
    jobId,
    jobTitle,
    jobType,
    location,
    salaryFrom,
    salaryTo,
    salaryCurrency,
    onPostAnother,
}: JobSuccessScreenProps) => {
    const router = useRouter();
    const salaryLabel = formatSalary(salaryFrom, salaryTo, salaryCurrency);

    const actions = [
        {
            icon: Eye,
            label: "View Job Posting",
            description: "See how candidates will view your job",
            href: jobId ? `/jobs/${jobId}` : "/jobs",
        },
        {
            icon: Pencil,
            label: "Edit Job Details",
            description: "Make changes to your posting",
            href: jobId ? `/job/watch?id=${jobId}` : "/jobs",
        },

    ];

    return (
        <div className="mx-auto max-w-2xl space-y-6 py-8">
            {/* Success icon */}
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                    <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        Job Posted Successfully!
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Your job posting is now live and visible to candidates
                    </p>
                </div>
            </div>

            {/* Job summary card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#005ca9]">
                            <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                {jobTitle}
                            </h2>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                {jobType && <span>{jobType}</span>}
                                {jobType && location && <span className="text-slate-300">•</span>}
                                {location && <span>{location}</span>}
                                {salaryLabel && <span className="text-slate-300">•</span>}
                                {salaryLabel && <span>{salaryLabel}</span>}
                            </p>
                        </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        Active
                    </span>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 divide-x divide-slate-100 rounded-lg border border-slate-100 dark:divide-slate-700/60 dark:border-slate-700/60">
                    {[
                        { label: "POSTED", value: "Just now" },
                        { label: "APPLICANTS", value: "0" },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col items-center gap-1 py-3">
                            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                {label}
                            </span>
                            <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* What's next */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="px-5 py-4">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        What&apos;s Next?
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {actions.map(({ icon: Icon, label, description, href }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => href && router.push(href)}
                            className="flex w-full items-center cursor-pointer gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                <Icon className="h-5 w-5 text-[#005ca9] dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Pro tip */}
            <div className="rounded-xl bg-[#005ca9] p-5 text-white">
                <div className="flex items-center gap-2 font-bold">
                    <Lightbulb className="h-5 w-5 text-yellow-300" />
                    <span>Pro Tip</span>
                </div>
                <p className="mt-2 text-sm cursor-pointer text-blue-100">
                    Share your job posting on LinkedIn, Twitter, and other social platforms to reach more qualified candidates!
                </p>
                <button
                    type="button"
                    className="mt-4 cursor-pointer rounded-lg border border-white bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                    Share Now
                </button>
            </div>

            {/* Footer actions */}
            <div className="flex cursor-pointer justify-center gap-3 pb-4">
                <Button variant="outline" onClick={onPostAnother} className="min-w-36 cursor-pointer">
                    Post Another Job
                </Button>
                <Button
                    onClick={() => router.push("/")}
                    className="min-w-36 cursor-pointer bg-[#005ca9] text-white hover:bg-[#005ca9]/90"
                >
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
};

export default JobSuccessScreen;
