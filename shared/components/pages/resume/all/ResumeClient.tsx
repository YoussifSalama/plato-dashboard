"use client";

import {
	IResume,
	useResumeStore,
} from "@/shared/store/pages/resume/useResumeStore";
import useDashboardStore from "@/shared/store/pages/dashboard/useDashboardStore";
import { useEffect, useMemo, useRef, useState } from "react";

import ResumeTable from "./ResumeTable";
import PaginationBar from "@/shared/common/features/PaginationBar";
import { useJobStore } from "@/shared/store/pages/job/useJobStore";

import {
	Search,
	Filter,
	Users,
	Star,
	Ban,
	Briefcase,
	LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { errorToast } from "@/shared/helper/toast";
import { useSearchParams } from "next/navigation";
interface IFilterObject {
	partial_matching: string | null;
	sort_by: string;
	sort_order: "asc" | "desc";
	page: number;
	recommendation: string | null;
	score: string | null;
	job_id: string | null;
	auto_invited: boolean | null;
	auto_shortlisted: boolean | null;
	auto_denied: boolean | null;
}

const formatDate = (value?: string | null) => {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString();
};

const AnalyticsCard = ({
	title,
	count,
	icon: Icon,
	colorClass,
}: {
	title: string;
	count: number | string;
	icon: LucideIcon;
	colorClass: string;
}) => (
	<div className="flex flex-col rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex-1 min-w-[200px]">
		<div className="flex justify-between items-start mb-6">
			<div
				className={cn(
					"flex h-14 w-14 items-center justify-center rounded-2xl",
					colorClass
				)}
			>
				<Icon className="h-6 w-6 text-white" />
			</div>
		</div>
		<div>
			<p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-1">
				{title}
			</p>
			<h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
				{count}
			</h3>
		</div>
	</div>
);

const DebouncedSearchInput = ({
	value,
	onChange,
}: {
	value: string;
	onChange: (val: string) => void;
}) => {
	const [localValue, setLocalValue] = useState(value);

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	useEffect(() => {
		const handle = setTimeout(() => {
			if (localValue !== value) onChange(localValue);
		}, 300);
		return () => clearTimeout(handle);
	}, [localValue, value, onChange]);

	return (
		<div className="relative w-full">
			<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
			<input
				type="text"
				placeholder="Search by candidate name..."
				className="w-full rounded-xl border-0 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-all dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800 dark:focus:ring-blue-500"
				onChange={(e) => setLocalValue(e.target.value)}
				value={localValue || ""}
			/>
		</div>
	);
};

const ResumeFilters = ({
	filterObject,
	onChange,
	jobOptions,
	onClear,
}: {
	filterObject: IFilterObject;
	onChange: (next: IFilterObject) => void;
	jobOptions: { label: string; value: string }[];
	onClear: () => void;
}) => {
	const triggerClass =
		"h-10 sm:w-[150px] w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-[13px] font-medium rounded-xl border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-colors cursor-pointer dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:ring-slate-800";

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
			{/* Search Input */}
			<DebouncedSearchInput
				value={filterObject.partial_matching || ""}
				onChange={(val) =>
					onChange({ ...filterObject, partial_matching: val || null, page: 1 })
				}
			/>

			{/* Filters Row */}
			<div className="flex flex-wrap items-center gap-3 sm:gap-4 px-1">
				<div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mr-2">
					<Filter className="h-4 w-4" />
					Filters:
				</div>

				{/* Status Dropdown */}
				<Select
					value={
						filterObject.auto_invited
							? "invited"
							: filterObject.auto_shortlisted
								? "shortlisted"
								: filterObject.auto_denied
									? "denied"
									: "all"
					}
					onValueChange={(val) => {
						onChange({
							...filterObject,
							auto_invited: val === "invited" ? true : null,
							auto_shortlisted: val === "shortlisted" ? true : null,
							auto_denied: val === "denied" ? true : null,
							page: 1,
						});
					}}
				>
					<SelectTrigger className={triggerClass}>
						<SelectValue placeholder="All Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="invited">Invited</SelectItem>
						<SelectItem value="shortlisted">Shortlisted</SelectItem>
						<SelectItem value="denied">Denied</SelectItem>
					</SelectContent>
				</Select>

				{/* Score */}
				<Select
					value={filterObject.score || "all"}
					onValueChange={(val) => {
						onChange({
							...filterObject,
							score: val === "all" ? null : val,
							page: 1,
						});
					}}
				>
					<SelectTrigger className={triggerClass}>
						<SelectValue placeholder="All Scores" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Scores</SelectItem>
						<SelectItem value="50">&gt; 50</SelectItem>
						<SelectItem value="70">&gt; 70</SelectItem>
						<SelectItem value="90">&gt; 90</SelectItem>
					</SelectContent>
				</Select>

				{/* Recommendation */}
				<Select
					value={filterObject.recommendation || "all"}
					onValueChange={(val) => {
						onChange({
							...filterObject,
							recommendation: val === "all" ? null : val,
							page: 1,
						});
					}}
				>
					<SelectTrigger className={cn(triggerClass, "hidden sm:flex")}>
						<SelectValue placeholder="All Recommendations" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Recommendations</SelectItem>
						<SelectItem value="highly_recommended">
							Highly Recommended
						</SelectItem>
						<SelectItem value="recommended">Recommended</SelectItem>
						<SelectItem value="consider">Consider</SelectItem>
						<SelectItem value="not_recommended">Not Recommended</SelectItem>
					</SelectContent>
				</Select>

				{/* Job */}
				<Select
					value={filterObject.job_id || "all"}
					onValueChange={(val) => {
						onChange({
							...filterObject,
							job_id: val === "all" ? null : val,
							page: 1,
						});
					}}
				>
					<SelectTrigger
						className={cn(
							triggerClass,
							"hidden md:flex min-w-[150px] w-auto max-w-[200px]"
						)}
					>
						<SelectValue placeholder="All Jobs" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Jobs</SelectItem>
						{jobOptions.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label.substring(0, 30)}
								{opt.label.length > 30 ? "..." : ""}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Sort */}
				<Select
					value={`${filterObject.sort_by}-${filterObject.sort_order}`}
					onValueChange={(val) => {
						const [sortBy, sortOrder] = val.split("-");
						onChange({
							...filterObject,
							sort_by: sortBy,
							sort_order: sortOrder as "asc" | "desc",
							page: 1,
						});
					}}
				>
					<SelectTrigger className={triggerClass}>
						<SelectValue placeholder="Sort Default" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="updated_at-desc">Newest First</SelectItem>
						<SelectItem value="updated_at-asc">Oldest First</SelectItem>
					</SelectContent>
				</Select>

				<div className="ml-auto w-full sm:w-auto mt-2 sm:mt-0">
					<button
						type="button"
						onClick={onClear}
						className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-[13px] font-medium text-slate-600 transition dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 focus:ring-2 focus:ring-inset focus:ring-blue-600"
					>
						Clear filters
					</button>
				</div>
			</div>
		</div>
	);
};

const ResumeClient = () => {
	const [filterObject, setFilterObject] = useState<IFilterObject>({
		partial_matching: null,
		sort_by: "updated_at",
		sort_order: "desc",
		page: 1,
		recommendation: null,
		score: null,
		job_id: null,
		auto_invited: null,
		auto_shortlisted: null,
		auto_denied: null,
	});
	const {
		getResumes,
		resumes,
		loadingGetResumes,
		meta,
		actionLoading,
		denyResume,
		shortlistResume,
		inviteResume,
		resumeStats,
		getResumeStats,
		scheduleAiCall,
	} = useResumeStore();

	const [aiCallTarget, setAiCallTarget] = useState<IResume | null>(null);
	const [scheduledAtInput, setScheduledAtInput] = useState<string>("");
	const { jobSearchResults, loadingJobSearch, searchJobs } = useJobStore();
	const { dashboard, getDashboard } = useDashboardStore();
	const lastQueryRef = useRef<string | null>(null);

	const shortlistedCount = resumeStats.shortlisted;
	const deniedCount = resumeStats.denied;
	const searchParams = useSearchParams();

	const preSelectedAccountId = useMemo(() => {
		const param = searchParams.get("accountId")?.trim();
		console.log("param", param);
		if (!param) return "";
		return Number.isFinite(Number(param)) ? param : "";
	}, [searchParams]);

	useEffect(() => {
		getDashboard(preSelectedAccountId);
	}, [getDashboard, preSelectedAccountId]);

	useEffect(() => {
		getResumeStats(preSelectedAccountId);
	}, [getResumeStats, preSelectedAccountId]);

	useEffect(() => {
		const partialMatching = filterObject.partial_matching ?? "";
		const recommendation = filterObject.recommendation ?? "";
		const score = filterObject.score ?? "";
		const jobId = filterObject.job_id ?? "";
		const queryKey = `${partialMatching}|${filterObject.sort_by}|${filterObject.sort_order}|${filterObject.page}|${recommendation}|${score}|${jobId}|${filterObject.auto_invited}|${filterObject.auto_shortlisted}|${filterObject.auto_denied}`;
		if (lastQueryRef.current === queryKey) return;
		lastQueryRef.current = queryKey;
		getResumes(
			partialMatching,
			filterObject.sort_by,
			filterObject.sort_order,
			filterObject.page,
			preSelectedAccountId,
			filterObject.recommendation,
			filterObject.score,
			filterObject.job_id ? Number(filterObject.job_id) : null,
			filterObject.auto_invited,
			filterObject.auto_shortlisted,
			filterObject.auto_denied
		);
	}, [filterObject, getResumes, preSelectedAccountId]);

	useEffect(() => {
		searchJobs("", preSelectedAccountId);
	}, [searchJobs, preSelectedAccountId]);

	return (
		<div className="space-y-6">
			{/* Analytics Top Bar */}
			<div className="flex flex-wrap gap-4">
				<AnalyticsCard
					title="Total candidates"
					count={dashboard?.metrics?.totalCandidates ?? "-"}
					icon={Users}
					colorClass="bg-[#2dd4bf]"
				/>
				<AnalyticsCard
					title="Active jobs"
					count={dashboard?.metrics?.activeJobs ?? "-"}
					icon={Briefcase}
					colorClass="bg-[#a78bfa]"
				/>
				<AnalyticsCard
					title="Shortlisted"
					count={shortlistedCount}
					icon={Star}
					colorClass="bg-[#fb923c]"
				/>
				<AnalyticsCard
					title="Denied"
					count={deniedCount}
					icon={Ban}
					colorClass="bg-[#f87171]"
				/>
			</div>

			{/* feature bar */}
			<ResumeFilters
				filterObject={filterObject}
				onChange={setFilterObject}
				jobOptions={jobSearchResults.map((job) => ({
					label: formatDate(job.created_at)
						? `${job.title} • ${formatDate(job.created_at)}`
						: job.title,
					value: String(job.id),
				}))}
				onClear={() =>
					setFilterObject({
						partial_matching: null,
						sort_by: "updated_at",
						sort_order: "desc",
						page: 1,
						recommendation: null,
						score: null,
						job_id: null,
						auto_invited: null,
						auto_shortlisted: null,
						auto_denied: null,
					})
				}
			/>
			{/* table */}
			<ResumeTable
				resumes={resumes}
				loading={loadingGetResumes}
				actionLoading={actionLoading}
				onDeny={(resume) =>
					denyResume(resume.id, !resume.auto_denied, preSelectedAccountId)
				}
				onShortlist={(resume) =>
					shortlistResume(
						resume.id,
						!resume.auto_shortlisted,
						preSelectedAccountId
					)
				}
				onInvite={(resume) => inviteResume(resume.id, preSelectedAccountId)}
				onAiCall={(resume) => {
					setAiCallTarget(resume);
					setScheduledAtInput("");
				}}
				accountId={preSelectedAccountId}
			/>
			{meta && meta.total_pages > 1 && (
				<PaginationBar
					currentPage={meta?.page ?? filterObject.page}
					totalPages={meta?.total_pages ?? 1}
					totalItems={meta?.total ?? 0}
					itemName="resumes"
					onPageChange={(page) =>
						setFilterObject((prev) => ({ ...prev, page }))
					}
				/>
			)}

			<Dialog
				open={aiCallTarget != null}
				onOpenChange={(open) => {
					if (!open) {
						setAiCallTarget(null);
						setScheduledAtInput("");
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Schedule AI call</DialogTitle>
						<DialogDescription>
							Choose whether to call this candidate now or schedule the AI call
							for a specific date and time.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<div className="text-sm text-slate-600 dark:text-slate-300">
							{aiCallTarget ? (
								<>
									Candidate:&nbsp;
									<span className="font-medium">
										{aiCallTarget.structured_name ||
											aiCallTarget.name ||
											"Unknown"}
									</span>
								</>
							) : null}
						</div>

						<div className="space-y-1">
							<label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
								Schedule for (optional)
							</label>
							<Input
								type="datetime-local"
								value={scheduledAtInput}
								onChange={(e) => setScheduledAtInput(e.target.value)}
								className="text-sm"
							/>
							<p className="text-[11px] text-slate-500 dark:text-slate-400">
								Leave empty and choose{" "}
								<span className="font-medium">Call now</span> to trigger the AI
								call immediately.
							</p>
						</div>
					</div>

					<DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setAiCallTarget(null);
								setScheduledAtInput("");
							}}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={!aiCallTarget || actionLoading?.type === "ai-call"}
							onClick={async () => {
								if (!aiCallTarget) return;
								await scheduleAiCall(aiCallTarget.id, preSelectedAccountId);
								setAiCallTarget(null);
								setScheduledAtInput("");
							}}
						>
							{actionLoading?.type === "ai-call" &&
							aiCallTarget &&
							String(actionLoading.id) === String(aiCallTarget.id)
								? "Calling now..."
								: "Call now"}
						</Button>
						<Button
							type="button"
							disabled={
								!aiCallTarget ||
								!scheduledAtInput ||
								actionLoading?.type === "ai-call"
							}
							onClick={async () => {
								if (!aiCallTarget) return;
								if (!scheduledAtInput) {
									errorToast(
										"Please pick a date and time to schedule the AI call."
									);
									return;
								}
								const iso = new Date(scheduledAtInput).toISOString();
								await scheduleAiCall(aiCallTarget.id, iso);
								setAiCallTarget(null);
								setScheduledAtInput("");
							}}
						>
							{actionLoading?.type === "ai-call" &&
							aiCallTarget &&
							String(actionLoading.id) === String(aiCallTarget.id)
								? "Scheduling..."
								: "Schedule at this time"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ResumeClient;
