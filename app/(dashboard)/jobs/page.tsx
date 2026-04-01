"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import JobTable from "@/shared/components/pages/job/JobTable";
import { useJobStore } from "@/shared/store/pages/job/useJobStore";
import type { JobListItem } from "@/shared/store/pages/job/useJobStore";
import PaginationBar from "@/shared/common/features/PaginationBar";
import { Search, Plus, Filter, ChevronDown, Check } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_JOBS: JobListItem[] = [
	{
		id: 1,
		title: "Senior Frontend Developer",
		workplace_type: "remote",
		employment_type: "full_time",
		seniority_level: "senior",
		industry: "Engineering",
		location: "Remote",
		is_active: true,
		effective_is_active: true,
		inactive_reason: null,
		created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		applicants_count: 45,
	},
	{
		id: 2,
		title: "Product Designer",
		workplace_type: "onsite",
		employment_type: "full_time",
		seniority_level: "mid",
		industry: "Design",
		location: "New York, NY",
		is_active: true,
		effective_is_active: true,
		inactive_reason: null,
		created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		applicants_count: 32,
	},
	{
		id: 3,
		title: "Marketing Manager",
		workplace_type: "hybrid",
		employment_type: "full_time",
		seniority_level: "mid",
		industry: "Marketing",
		location: "San Francisco, CA",
		is_active: true,
		effective_is_active: true,
		inactive_reason: null,
		created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		applicants_count: 28,
	},
	{
		id: 4,
		title: "Backend Engineer",
		workplace_type: "remote",
		employment_type: "contract",
		seniority_level: "senior",
		industry: "Engineering",
		location: "Remote",
		is_active: false,
		effective_is_active: false,
		inactive_reason: null,
		created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
		applicants_count: 0,
	},
	{
		id: 5,
		title: "HR Specialist",
		workplace_type: "onsite",
		employment_type: "part_time",
		seniority_level: "junior",
		industry: "Human Resources",
		location: "Boston, MA",
		is_active: false,
		effective_is_active: false,
		inactive_reason: "manual_inactive",
		created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
		applicants_count: 67,
	},
];

const TYPE_OPTIONS = [
	{ label: "All types", value: "all" },
	{ label: "Full-time", value: "full_time" },
	{ label: "Part-time", value: "part_time" },
	{ label: "Contract", value: "contract" },
	{ label: "Internship", value: "internship" },
];

const DEPARTMENT_OPTIONS = [
	{ label: "All department", value: "all" },
	{ label: "Engineering", value: "Engineering" },
	{ label: "Design", value: "Design" },
	{ label: "Marketing", value: "Marketing" },
	{ label: "Human Resources", value: "Human Resources" },
	{ label: "Finance", value: "Finance" },
	{ label: "Sales", value: "Sales" },
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

const PAGE_SIZE = 5;

const JobsPage = () => {
	const { jobs, loadingJobs, hasLoadedJobs, meta, getJobs } = useJobStore();
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

		getJobs(
			filters.search,
			filters.sort_by,
			filters.sort_order,
			filters.page,
			null,
			filters.department === "all" ? "" : filters.department
		);
	}, [filters, getJobs]);

	const usingMock = hasLoadedJobs && jobs.length === 0;

	// Client-side filter mock data by search/type/department
	const displayJobs: JobListItem[] = usingMock
		? MOCK_JOBS.filter((j) => {
				const matchSearch =
					!filters.search ||
					j.title.toLowerCase().includes(filters.search.toLowerCase());
				const matchType =
					filters.type === "all" || j.employment_type === filters.type;
				const matchDept =
					filters.department === "all" || j.industry === filters.department;
				return matchSearch && matchType && matchDept;
			})
		: jobs;

	const pagedMock = usingMock
		? displayJobs.slice((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE)
		: jobs;

	const totalItems = usingMock ? displayJobs.length : (meta?.total ?? 0);
	const totalPages = usingMock
		? Math.max(1, Math.ceil(displayJobs.length / PAGE_SIZE))
		: (meta?.total_pages ?? 1);

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
						Manage your job postings and track applications
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
				<JobTable
					jobs={usingMock ? pagedMock : jobs}
					loading={loadingJobs}
					hasLoaded={hasLoadedJobs}
				/>
				{(totalItems > 0 || usingMock) && (
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
