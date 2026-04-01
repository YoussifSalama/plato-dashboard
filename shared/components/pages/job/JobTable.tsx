"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
	FileText,
	Pencil,
	SearchCode,
	MapPin,
	Users,
	Clock,
	EyeIcon,
	SquarePen,
} from "lucide-react";
import { useJobStore } from "@/shared/store/pages/job/useJobStore";
import type { JobListItem } from "@/shared/store/pages/job/useJobStore";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { apiClient } from "@/lib/apiClient";

dayjs.extend(relativeTime);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatLabel = (value?: string) =>
	value
		? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
		: "-";

const StatusBadge = ({ job }: { job: JobListItem }) => {
	const isActive = job.effective_is_active ?? job.is_active;

	if (isActive) {
		return (
			<span className="inline-flex items-center rounded-full bg-[#22c55e] px-3 py-1 text-[11px] font-bold tracking-wide text-white">
				Active
			</span>
		);
	}

	if (!job.inactive_reason) {
		return (
			<span className="inline-flex items-center rounded-full bg-slate-500 px-3 py-1 text-[11px] font-bold tracking-wide text-white">
				Draft
			</span>
		);
	}

	return (
		<span className="inline-flex items-center rounded-full bg-[#ef4444] px-3 py-1 text-[11px] font-bold tracking-wide text-white">
			Closed
		</span>
	);
};

// ─── Applicant Count ──────────────────────────────────────────────────────────

const ApplicantCount = ({ job }: { job: JobListItem }) => {
	const [count, setCount] = useState<number | null>(
		job.applicants_count ?? null
	);

	useEffect(() => {
		if (job.applicants_count !== undefined) return;
		apiClient
			.get(`/agency/jobs/${job.id}/resumes`, { params: { limit: 1 } })
			.then((r) => setCount(r.data?.meta?.total ?? 0))
			.catch(() => setCount(0));
	}, [job.id, job.applicants_count]);

	return (
		<div className="flex items-center gap-2 text-[14px] font-bold text-slate-700 dark:text-slate-200">
			<Users className="h-4 w-4 text-blue-400 stroke-[2.5]" />
			{count === null ? (
				<span className="text-slate-300">...</span>
			) : (
				<span>{count}</span>
			)}
		</div>
	);
};

// ─── Skeleton rows ────────────────────────────────────────────────────────────

const SkeletonRow = () => (
	<TableRow className="border-b border-slate-100 dark:border-slate-800">
		{[280, 120, 140, 90, 80, 70, 200].map((w, i) => (
			<TableCell key={i} className="py-4">
				<div
					className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
					style={{ width: w }}
				/>
			</TableCell>
		))}
	</TableRow>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const JobTable = ({
	jobs,
	loading,
	hasLoaded,
}: {
	jobs: JobListItem[];
	loading: boolean;
	hasLoaded: boolean;
}) => {
	const { deleteJob, loadingDeleteJob } = useJobStore();
	const [jobToDelete, setJobToDelete] = useState<number | null>(null);

	const handleDelete = async () => {
		if (!jobToDelete) return;
		await deleteJob(jobToDelete, null);
		setJobToDelete(null);
	};

	return (
		<Dialog
			open={jobToDelete !== null}
			onOpenChange={(open) => !open && setJobToDelete(null)}
		>
			<Table>
				<TableHeader>
					<TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
						<TableHead className="pl-6 h-11 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
							JOB TITLE
						</TableHead>
						<TableHead className="h-11 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
							DEPARTMENT
						</TableHead>
						<TableHead className="h-11 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
							LOCATION
						</TableHead>
						<TableHead className="h-11 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
							TYPE
						</TableHead>
						<TableHead className="h-11 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
							STATUS
						</TableHead>
						<TableHead className="h-11 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
							APPLICANTS
						</TableHead>
						<TableHead className="h-11 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase text-right pr-6">
							ACTIONS
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading || (!hasLoaded && jobs.length === 0) ? (
						<>
							{Array.from({ length: 5 }).map((_, i) => (
								<SkeletonRow key={i} />
							))}
						</>
					) : jobs.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={7}
								className="py-16 text-center text-[14px] text-slate-400"
							>
								No jobs found.
							</TableCell>
						</TableRow>
					) : (
						jobs.map((job) => (
							<TableRow
								key={job.id}
								className="border-b border-slate-100 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-900/40"
							>
								{/* Title */}
								<TableCell className="pl-6 py-4">
									<div className="flex flex-col gap-1">
										<span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
											{job.title}
										</span>
										<div className="flex items-center gap-1.5 text-[12px] text-slate-400">
											<Clock className="h-3 w-3" />
											<span>{dayjs(job.created_at).fromNow()}</span>
										</div>
									</div>
								</TableCell>

								{/* Department */}
								<TableCell className="py-4 text-[13px] font-medium text-slate-600 dark:text-slate-300">
									{formatLabel(job.industry)}
								</TableCell>

								{/* Location */}
								<TableCell className="py-4">
									<div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
										<MapPin className="h-3.5 w-3.5 shrink-0" />
										<span>{job.location}</span>
									</div>
								</TableCell>

								{/* Type */}
								<TableCell className="py-4 text-[13px] font-medium text-slate-600 dark:text-slate-300">
									{formatLabel(job.employment_type)}
								</TableCell>

								{/* Status */}
								<TableCell className="py-4">
									<StatusBadge job={job} />
								</TableCell>

								{/* Applicants */}
								<TableCell className="py-4">
									<ApplicantCount job={job} />
								</TableCell>

								{/* Actions */}
								<TableCell className="py-4 pr-6">
									<div className="flex items-center justify-end gap-2">
										<Link
											href={`/resumes/analyse?jobId=${job.id}`}
											className="inline-flex items-center gap-1.5 rounded-xl bg-[#005ca9] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#004e8f]"
										>
											<EyeIcon className="h-3.5 w-3.5" />
											Analyze Resumes
										</Link>
										<Link
											href={`/jobs/${job.id}/resumes`}
											className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-[#005ca9] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
										>
											<FileText className="h-3.5 w-3.5" />
											View Resumes
										</Link>
										<Link
											href={`/job/watch?id=${job.id}`}
											className="flex h-8 w-8 items-center justify-center text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
											title="Edit job"
										>
											<SquarePen className="h-[15px] w-[15px]" />
										</Link>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			{/* Delete Confirmation Dialog */}
			<DialogContent className="sm:max-w-106.25">
				<DialogHeader>
					<DialogTitle>Delete Job</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this job? This action cannot be
						undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="mt-4 gap-2">
					<button
						onClick={() => setJobToDelete(null)}
						disabled={loadingDeleteJob}
						className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
					>
						Cancel
					</button>
					<button
						onClick={handleDelete}
						disabled={loadingDeleteJob}
						className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
					>
						{loadingDeleteJob ? (
							<>
								<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
								Deleting...
							</>
						) : (
							"Delete Job"
						)}
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default JobTable;
