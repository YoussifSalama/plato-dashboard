"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import JobTable from "@/shared/components/pages/job/JobTable";
import { useJobStore } from "@/shared/store/pages/job/useJobStore";
import PaginationBar from "@/shared/common/features/PaginationBar";
import { Search, Plus, Filter, ChevronDown, Check } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";

// ─── Filter options ────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
	{ label: "All types", value: "all" },
	{ label: "Full-time", value: "full_time" },
	{ label: "Part-time", value: "part_time" },
	{ label: "Contract", value: "contract" },
	{ label: "Freelance", value: "freelance" },
	{ label: "Internship", value: "internship" },
];

const DEPARTMENT_OPTIONS = [
	{ label: "All departments", value: "all" },
	{ label: "Technology", value: "technology" },
	{ label: "Marketing", value: "marketing" },
	{ label: "Education", value: "education" },
	{ label: "Finance", value: "finance" },
	{ label: "Legal", value: "legal" },
	{ label: "Healthcare", value: "healthcare" },
	{ label: "Retail", value: "retail" },
	{ label: "Manufacturing", value: "manufacturing" },
	{ label: "Consulting", value: "consulting" },
	{ label: "Real estate", value: "real_estate" },
	{ label: "Media", value: "media" },
	{ label: "Government", value: "government" },
	{ label: "Non-profit", value: "non_profit" },
	{ label: "Construction", value: "construction" },
	{ label: "Transportation", value: "transportation" },
	{ label: "Other", value: "other" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

type JobFilterState = {
	search: string;
	type: string;
	department: string;
	sort_by: string;
	sort_order: "asc" | "desc";
	page: number;
};

const PAGE_SIZE = 10;

const JobsPage = () => {
	const { jobs, loadingJobs, hasLoadedJobs, meta, getAdminJobs } = useJobStore();
	const [filters, setFilters] = useState<JobFilterState>({
		search: "",
		type: "all",
		department: "all",
		sort_by: "created_at",
		sort_order: "desc",
		page: 1,
	});
	const lastQueryRef = useRef<string | null>(null);

	useEffect(() => {
		const queryKey = `${filters.search}|${filters.sort_by}|${filters.sort_order}|${filters.page}|${filters.type}|${filters.department}`;
		if (lastQueryRef.current === queryKey) return;
		lastQueryRef.current = queryKey;

		getAdminJobs(
			filters.search,
			filters.sort_by,
			filters.sort_order,
			filters.page,
			filters.department === "all" ? null : filters.department,
			filters.type === "all" ? null : filters.type
		);
	}, [filters, getAdminJobs]);

	const totalItems = meta?.total ?? 0;
	const totalPages = meta?.total_pages ?? 1;

	const selectedType =
		TYPE_OPTIONS.find((o) => o.value === filters.type) ?? TYPE_OPTIONS[0];
	const selectedDept =
		DEPARTMENT_OPTIONS.find((o) => o.value === filters.department) ??
		DEPARTMENT_OPTIONS[0];

	return (
		<section className="space-y-6 mx-auto w-full">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 px-2">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						Jobs
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Manage job postings across all companies
					</p>
				</div>
				<Button
					asChild
					className="rounded-[10px] bg-[#005ca9] text-[14px] font-semibold text-white hover:bg-[#004e8f] h-10 px-4 transition-colors shadow-sm"
				>
					<Link href="/jobs/new" className="flex items-center gap-1.5">
						<Plus className="h-4 w-4 stroke-[2.5]" />
						Add New Job
					</Link>
				</Button>
			</div>

			{/* Filter bar */}
			<div className="rounded-[20px] bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 flex items-center gap-2 px-4 py-2.5">
				{/* Search */}
				<div className="flex flex-1 items-center gap-2.5">
					<Search className="h-4 w-4 shrink-0 text-slate-400" />
					<input
						type="text"
						placeholder="Search jobs by title..."
						className="w-full bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200"
						value={filters.search}
						onChange={(e) =>
							setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
						}
					/>
				</div>

				<div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

				{/* Type dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
						>
							{selectedType.label}
							<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-44 rounded-2xl p-1.5 dark:bg-slate-900 dark:border-slate-800"
					>
						{TYPE_OPTIONS.map((opt) => (
							<DropdownMenuItem
								key={opt.value}
								onClick={() =>
									setFilters((prev) => ({ ...prev, type: opt.value, page: 1 }))
								}
								className={clsx(
									"cursor-pointer rounded-xl flex items-center justify-between text-[13px]",
									filters.type === opt.value && "font-semibold"
								)}
							>
								{opt.label}
								{filters.type === opt.value && (
									<Check className="h-3.5 w-3.5 text-blue-500" />
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Department dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
						>
							{selectedDept.label}
							<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-48 rounded-2xl p-1.5 dark:bg-slate-900 dark:border-slate-800"
					>
						{DEPARTMENT_OPTIONS.map((opt) => (
							<DropdownMenuItem
								key={opt.value}
								onClick={() =>
									setFilters((prev) => ({
										...prev,
										department: opt.value,
										page: 1,
									}))
								}
								className={clsx(
									"cursor-pointer rounded-xl flex items-center justify-between text-[13px]",
									filters.department === opt.value && "font-semibold"
								)}
							>
								{opt.label}
								{filters.department === opt.value && (
									<Check className="h-3.5 w-3.5 text-blue-500" />
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Filter icon */}
				<button
					type="button"
					className="flex h-8 w-8 items-center justify-center rounded-[10px] text-slate-400 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900"
				>
					<Filter className="h-4 w-4" />
				</button>
			</div>

			{/* Table */}
			<div className="rounded-[20px] bg-white shadow-xs border border-slate-100 dark:border-slate-800 dark:bg-slate-950 overflow-hidden pb-4">
				<JobTable jobs={jobs} loading={loadingJobs} hasLoaded={hasLoadedJobs} />
				{totalItems > 0 && (
					<div className="mt-2 px-2">
						<PaginationBar
							currentPage={filters.page}
							totalPages={totalPages}
							totalItems={totalItems}
							itemName="jobs"
							pageSize={PAGE_SIZE}
							onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
							className="border-0 shadow-none px-4"
						/>
					</div>
				)}
			</div>
		</section>
	);
};

export default JobsPage;
