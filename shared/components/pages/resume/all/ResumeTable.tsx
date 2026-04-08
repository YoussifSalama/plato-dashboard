import { IResume } from "@/shared/store/pages/resume/useResumeStore";
import { cn } from "@/lib/utils";
import {
	Mail,
	FileText,
	Star,
	Loader2,
	FileIcon,
	Calendar,
} from "lucide-react";
import Link from "next/link";
import LoadingEllipsis from "@/shared/components/common/LoadingEllipsis";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

const formatDate = (value?: string | null) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleDateString();
};

const formatTimeAgo = (value?: string | null) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return `Applied ${formatDistanceToNow(date, { addSuffix: true })}`;
};

const formatFallbackName = (raw?: string | null) => {
	if (!raw) return "-";
	return (
		raw
			.replace(/\.[^/.]+$/i, "")
			.replace(/resume/gi, "")
			.replace(/[-_]+/g, " ")
			.replace(/\s+/g, " ")
			.trim() || "-"
	);
};

const getInitials = (name: string) => {
	if (!name || name === "-") return "?";
	const parts = name.split(" ");
	if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	return name.substring(0, 2).toUpperCase();
};

const formatRecommendationLabel = (value?: string | null) =>
	value?.replace(/_/g, " ") ?? "-";

const getRecommendationTone = (
	value?: string | null
): "success" | "danger" | "info" | "warning" | "neutral" => {
	switch (value) {
		case "highly_recommended":
		case "recommended":
			return "success";
		case "consider":
			return "warning";
		case "not_recommended":
			return "danger";
		default:
			return "neutral";
	}
};

const StatusBadge = ({
	label,
	tone,
}: {
	label: string;
	tone: "success" | "danger" | "info" | "warning" | "neutral";
}) => {
	const config = {
		success:
			"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/20",
		danger:
			"bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-500/20",
		info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-500/20",
		warning:
			"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-500/20",
		neutral:
			"bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
	};
	const dotColors = {
		success: "bg-emerald-500",
		danger: "bg-red-500",
		info: "bg-blue-500",
		warning: "bg-amber-500",
		neutral: "bg-slate-400",
	};
	return (
		<span
			className={cn(
				`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider`,
				config[tone]
			)}
		>
			<span
				className={cn(`h-1.5 w-1.5 rounded-full shadow-sm`, dotColors[tone])}
			/>
			<span className="truncate max-w-[120px]">{label}</span>
		</span>
	);
};

const renderStatus = (resume: IResume) => {
	if (resume.auto_denied) return <StatusBadge label="Denied" tone="danger" />;

	const badges = [];
	if (resume.auto_shortlisted)
		badges.push(
			<StatusBadge key="shortlisted" label="Shortlisted" tone="success" />
		);
	if (resume.auto_invited)
		badges.push(<StatusBadge key="invited" label="Invited" tone="info" />);

	if (!badges.length) return <StatusBadge label="New" tone="neutral" />;
	return <div className="flex flex-wrap gap-2">{badges}</div>;
};

const getAvatarColor = (id: string) => {
	const colors = [
		"bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400",
		"bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
		"bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
		"bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
		"bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
		"bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
	];
	let sum = 0;
	for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
	return colors[sum % colors.length];
};

const ResumeTable = ({
	resumes,
	loading,
	onDeny,
	onShortlist,
	onInvite,
	onAiCall,
	actionLoading,
	accountId,
}: {
	resumes: IResume[];
	loading: boolean;
	onDeny?: (resume: IResume) => void;
	onShortlist?: (resume: IResume) => void;
	onInvite?: (resume: IResume) => void;
	onAiCall?: (resume: IResume) => void;
	actionLoading?: {
		id: string | number;
		type: "deny" | "shortlist" | "invite" | "ai-call";
	} | null;
	accountId: number | string;
}) => {
	const showActions = Boolean(onDeny || onShortlist || onInvite || onAiCall);
	const isActionLoading = (
		resumeId: string | number,
		type: "deny" | "shortlist" | "invite" | "ai-call"
	) =>
		actionLoading?.id != null &&
		String(actionLoading.id) === String(resumeId) &&
		actionLoading.type === type;

	if (loading)
		return (
			<div className="flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
				<span className="inline-flex items-center justify-center gap-2 text-slate-500">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>Loading resumes</span>
					<LoadingEllipsis />
				</span>
			</div>
		);

	if (!resumes.length)
		return (
			<div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
				<p className="text-sm text-slate-500 dark:text-slate-400">
					No resumes found.
				</p>
			</div>
		);

	return (
		<div className="space-y-4 w-full">
			{resumes.map((resume) => {
				const displayName =
					resume.structured_name ??
					formatFallbackName(resume.name ?? resume.link);
				const email = resume.structured_email ?? "-";
				const score = resume.resume_analysis?.score;

				return (
					<div
						key={resume.id}
						className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
					>
						<div className="flex flex-col sm:flex-row justify-between gap-4">
							<div className="flex flex-1 items-start gap-4">
								<div
									className={cn(
										"flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold mt-1",
										getAvatarColor(String(resume.id))
									)}
								>
									{getInitials(displayName)}
								</div>

								<div className="space-y-3 flex-1 min-w-0">
									<h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
										{displayName}
									</h3>
									<div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
										<div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
											<Mail className="h-4 w-4 shrink-0 text-slate-400" />
											<span className="truncate max-w-[200px]">{email}</span>
										</div>

										<a
											href={`${process.env.NEXT_PUBLIC_FILES_RESUME}/${resume.link}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
										>
											<FileIcon className="h-4 w-4 shrink-0" />
											<span className="truncate">View Source File</span>
										</a>
									</div>

									<div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
										<FileText className="h-3 w-3 shrink-0" />
										{formatTimeAgo(resume.created_at) ||
											`Applied ${formatDate(resume.created_at)}`}
									</div>
								</div>
							</div>

							<div className="flex flex-col items-start sm:items-end gap-2 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0 dark:border-slate-800">
								<div className="flex items-center justify-end gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
									{score != null && (
										<div className="flex items-center gap-1.5 shrink-0 px-2">
											<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
											<span className="font-bold text-slate-700 dark:text-slate-200">
												{score}/100
											</span>
										</div>
									)}
									<StatusBadge
										label={formatRecommendationLabel(
											resume.resume_analysis?.recommendation
										)}
										tone={getRecommendationTone(
											resume.resume_analysis?.recommendation
										)}
									/>
									{renderStatus(resume)}
								</div>
							</div>
						</div>

						<div className="flex w-full flex-col sm:flex-row flex-wrap items-center gap-2 mt-1 border-t border-slate-200 pt-4 dark:border-slate-800">
							<Link
								href={`/resumes/${resume.id}?accountId=${accountId}`}
								className="w-full sm:w-auto"
							>
								<Button className="w-full sm:w-auto bg-[#0060ad] hover:bg-[#004e8d] text-white">
									View Profile
								</Button>
							</Link>

							{showActions && (
								<>
									{onShortlist && (
										<Button
											variant="outline"
											className="w-full sm:w-auto dark:border-slate-700 dark:text-slate-300"
											disabled={isActionLoading(resume.id, "shortlist")}
											onClick={() => onShortlist(resume)}
										>
											{resume.auto_shortlisted
												? "Remove from shortlist"
												: "Shortlist"}
										</Button>
									)}
									{onInvite && (
										<Tooltip content={null}>
											<div>
												<Button
													className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
													disabled={isActionLoading(resume.id, "invite")}
													onClick={() => onInvite(resume)}
												>
													Send invitation
												</Button>
											</div>
										</Tooltip>
									)}
									{onAiCall && (
										<Button
											variant="ghost"
											className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700 hover:text-white flex items-center justify-center"
											disabled={isActionLoading(resume.id, "ai-call")}
											onClick={() => onAiCall(resume)}
										>
											<span>Schedule AI Call</span>
											<Calendar className="h-4 w-4 shrink-0" />
										</Button>
									)}
									{onDeny && (
										<Button
											variant="outline"
											className="w-full sm:w-auto border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
											disabled={isActionLoading(resume.id, "deny")}
											onClick={() => onDeny(resume)}
										>
											{resume.auto_denied ? "Remove from denied" : "Deny"}
										</Button>
									)}
								</>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default ResumeTable;
