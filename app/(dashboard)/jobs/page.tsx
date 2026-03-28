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
import { jobIndustryOptions } from "@/shared/core/job/options";
import clsx from "clsx";
import { Tooltip } from "@/components/ui/tooltip";

type JobFilterState = {
	partial_matching: string;
	sort_by: string;
	sort_order: "asc" | "desc";
	page: number;
	status: "all" | "active" | "inactive";
	industry: string;
};

const INDUSTRIES = [
	{ label: "All Industries", value: "all" },
	...jobIndustryOptions,
];

const JobsPage = () => {
	const { jobs, loadingJobs, hasLoadedJobs, meta, getJobs } = useJobStore();
	const [filters, setFilters] = useState<JobFilterState>({
		partial_matching: "",
		sort_by: "created_at",
		sort_order: "desc",
		page: 1,
		status: "all",
		industry: "all",
	});
	const lastQueryRef = useRef<string | null>(null);

	useEffect(() => {
		const queryKey = `${filters.partial_matching}|${filters.sort_by}|${filters.sort_order}|${filters.page}|${filters.status}|${filters.industry}`;
		if (lastQueryRef.current === queryKey) return;
		lastQueryRef.current = queryKey;

		const isActiveParam =
			filters.status === "active"
				? true
				: filters.status === "inactive"
					? false
					: null;

		getJobs(
			filters.partial_matching,
			filters.sort_by,
			filters.sort_order,
			filters.page,
			isActiveParam,
			filters.industry
		);
	}, [filters, getJobs]);

	return (
		<section className="space-y-6 mx-auto w-full">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 px-2">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						Jobs
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Manage your job postings and track applications
					</p>
				</div>
				<Tooltip content={null}>
					<div>
						<Button
							asChild
							className={clsx(
								"rounded-[10px] bg-[#005ca9] text-[14px] font-semibold text-white hover:bg-[#004e8f] h-10 px-4 transition-colors shadow-sm"
							)}
						>
							<Link href="/jobs/new" className="flex items-center gap-1.5">
								<Plus className="h-4 w-4 stroke-[2.5]" />
								Add New Job
							</Link>
						</Button>
					</div>
				</Tooltip>
			</div>

			<div className="rounded-[20px] bg-white p-3 shadow-xs border border-slate-100 flex flex-col md:flex-row items-center gap-4 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
				<div className="flex-1 flex items-center gap-3 px-4 py-2 w-full">
					<Search className="h-5 w-5 text-slate-400" />
					<input
						type="text"
						placeholder="Search jobs by title..."
						className="w-full bg-transparent text-[14px] font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal outline-none dark:text-slate-200"
						value={filters.partial_matching}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								partial_matching: e.target.value,
								page: 1,
							}))
						}
					/>
				</div>
				<div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
				<div className="flex items-center gap-3 px-2 w-full md:w-auto overflow-x-auto hide-scrollbar">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900">
						<Filter className="h-4 w-4 stroke-[2.5]" />
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex h-10 shrink-0 items-center gap-3 rounded-[12px] bg-slate-50 px-4 py-2 cursor-pointer hover:bg-slate-100 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800">
								<div className="flex flex-col">
									<span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
										Status
									</span>
									<span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 leading-tight capitalize">
										{filters.status} Status
									</span>
								</div>
								<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[160px] rounded-[12px] p-2 dark:bg-slate-900 dark:border-slate-800"
						>
							{["all", "active", "inactive"].map((s) => (
								<DropdownMenuItem
									key={s}
									onClick={() =>
										setFilters((prev) => ({
											...prev,
											status: s as "all" | "active" | "inactive",
											page: 1,
										}))
									}
									className="cursor-pointer rounded-[8px] flex items-center justify-between capitalize"
								>
									{s}
									{filters.status === s && (
										<Check className="h-4 w-4 text-blue-500" />
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex h-10 shrink-0 items-center gap-3 rounded-[12px] bg-slate-50 px-4 py-2 cursor-pointer hover:bg-slate-100 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800">
								<div className="flex flex-col">
									<span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
										Industry
									</span>
									<span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
										{INDUSTRIES.find((i) => i.value === filters.industry)
											?.label || "All Industries"}
									</span>
								</div>
								<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[180px] rounded-[12px] p-2 dark:bg-slate-900 dark:border-slate-800 max-h-[300px] overflow-y-auto"
						>
							{INDUSTRIES.map((dept) => (
								<DropdownMenuItem
									key={dept.value}
									onClick={() =>
										setFilters((prev) => ({
											...prev,
											industry: dept.value,
											page: 1,
										}))
									}
									className="cursor-pointer rounded-[8px] flex items-center justify-between"
								>
									{dept.label}
									{filters.industry === dept.value && (
										<Check className="h-4 w-4 text-blue-500" />
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="rounded-[20px] bg-white shadow-xs border border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none overflow-hidden pb-4">
				<JobTable jobs={jobs} loading={loadingJobs} hasLoaded={hasLoadedJobs} />
				{meta && (
					<div className="mt-4 px-2 hover:bg-transparent">
						<PaginationBar
							currentPage={meta.page ?? filters.page}
							totalPages={meta.total_pages ?? 1}
							totalItems={meta.total}
							itemName="jobs"
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
