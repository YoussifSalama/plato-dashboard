import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
	FileText,
	Settings,
	Eye,
	Pencil,
	SearchCode,
	MapPin,
	Users,
	Clock,
	MoreVertical,
	Trash2,
} from "lucide-react";
import { useJobStore } from "@/shared/store/pages/job/useJobStore";
import type { JobListItem } from "@/shared/store/pages/job/useJobStore";
import LoadingEllipsis from "@/shared/components/common/LoadingEllipsis";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Cookies from "js-cookie";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";
import { useState, useEffect } from "react";

dayjs.extend(relativeTime);

const getToken = () => {
	if (typeof window === "undefined") return null;
	return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

const ApplicantCount = ({ jobId }: { jobId: number }) => {
	const [count, setCount] = useState<number | null>(null);

	useEffect(() => {
		const fetchCount = async () => {
			const token = getToken();
			if (!token) return;
			try {
				const response = await apiClient.get(`/agency/jobs/${jobId}/resumes`, {
					headers: { Authorization: `Bearer ${token}` },
					params: { limit: 1 }, // We only need the meta.total
				});
				const total = response.data?.meta?.total ?? 0;
				setCount(total);
			} catch {
				setCount(0);
			}
		};

		fetchCount();
	}, [jobId]);

	if (count === null) {
		return <span className="text-slate-400">...</span>;
	}

	return <>{count}</>;
};

const formatLabel = (value?: string) =>
	value
		? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
		: "-";

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
		const token = getToken();
		await deleteJob(jobToDelete, token);
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
						<TableHead className="w-[280px] pl-6 h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							JOB TITLE
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							INDUSTRY
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							LOCATION
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							TYPE
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							STATUS
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							APPLICANTS
						</TableHead>
						<TableHead className="text-left h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							ACTIONS
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading || (!hasLoaded && jobs.length === 0) ? (
						<TableRow>
							<TableCell colSpan={7} className="text-center">
								<span className="inline-flex items-center justify-center gap-1 text-slate-500">
									<span>Loading jobs</span>
									<LoadingEllipsis />
								</span>
							</TableCell>
						</TableRow>
					) : jobs.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} className="text-center text-slate-500">
								No jobs yet.
							</TableCell>
						</TableRow>
					) : (
						jobs.map((job) => {
							const isEffectivelyActive =
								job.effective_is_active ?? job.is_active;
							const inactiveReason =
								job.inactive_reason === "auto_deactivated"
									? "Auto Deactivated"
									: "Manually Deactivated";
							return (
								<TableRow
									key={job.id}
									className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50"
								>
									<TableCell className="py-4">
										<div className="flex flex-col gap-1">
											<span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
												{job.title}
											</span>
											<div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium">
												<Clock className="h-3 w-3 stroke-[2.5]" />
												<span>{dayjs(job.created_at).fromNow()}</span>
											</div>
										</div>
									</TableCell>
									<TableCell className="py-4 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
										{formatLabel(job.industry)}
									</TableCell>
									<TableCell className="py-4">
										<div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-400">
											<MapPin className="h-3.5 w-3.5 stroke-[2.5]" />
											<span>{job.location}</span>
										</div>
									</TableCell>
									<TableCell className="py-4 text-[13px] font-semibold text-slate-400">
										{formatLabel(job.employment_type)}
									</TableCell>
									<TableCell className="py-4">
										{isEffectivelyActive ? (
											<span className="inline-flex items-center rounded-full bg-[#22c55e] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
												Active
											</span>
										) : (
											<div className="inline-flex flex-col gap-1">
												<span className="inline-flex items-center rounded-full bg-[#ef4444] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white dark:bg-slate-600">
													{inactiveReason}
												</span>
											</div>
										)}
									</TableCell>
									<TableCell className="py-4">
										<div className="flex items-center gap-2 text-[14px] font-bold text-slate-700 dark:text-slate-200">
											<Users className="h-4 w-4 text-blue-500 stroke-[2.5]" />
											<ApplicantCount jobId={job.id} />
										</div>
									</TableCell>
									<TableCell className="text-right py-4">
										<div className="inline-flex items-center justify-end gap-3">
											<Link
												href={`/resumes/analyse?jobId=${job.id}`}
												className="inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-[#005ca9] px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#004e8f] shadow-sm"
												title="Analyze resumes for this job"
											>
												<SearchCode className="h-3.5 w-3.5 stroke-[2.5]" />
												Analyze Resumes
											</Link>
											<Link
												href={`/jobs/${job.id}/resumes`}
												className="inline-flex items-center justify-center gap-1.5 rounded-[8px] border-[1.5px] border-blue-200 bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#005ca9] transition hover:bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
												title="View job resumes"
											>
												<FileText className="h-3.5 w-3.5 stroke-[2.5]" />
												View Resumes
											</Link>

											<div className="flex items-center gap-2 ml-2">
												<Link
													href={`/jobs/${job.id}`}
													className="text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-200"
													title="View job details"
												>
													<Eye className="h-[18px] w-[18px] stroke-[2.5]" />
												</Link>
												<Link
													href={`/job/watch?id=${job.id}`}
													className="text-amber-400 hover:text-amber-500 transition-colors"
													title="Edit job"
												>
													<Pencil className="h-[18px] w-[18px] stroke-[2.5]" />
												</Link>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<button
															className="text-slate-300 hover:text-slate-500 transition-colors dark:text-slate-600 dark:hover:text-slate-400"
															title="More options"
														>
															<MoreVertical className="h-[18px] w-[18px] stroke-[2.5]" />
														</button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="w-40 rounded-[12px] p-2 dark:bg-slate-900 dark:border-slate-800"
													>
														<DropdownMenuItem
															onClick={() => setJobToDelete(job.id)}
															className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-[8px] cursor-pointer"
														>
															<Trash2 className="mr-2 h-4 w-4" />
															<span>Delete Job</span>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>

			{/* Delete Confirmation Dialog */}
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Delete Job</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this job? This action cannot be
						undone, and will permanently remove this job from your agency.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="mt-4 gap-2 sm:gap-0">
					<button
						onClick={() => setJobToDelete(null)}
						disabled={loadingDeleteJob}
						className="inline-flex items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
					>
						Cancel
					</button>
					<button
						onClick={handleDelete}
						disabled={loadingDeleteJob}
						className="inline-flex items-center justify-center ml-3 rounded-[8px] bg-red-600 px-4 py-2 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
