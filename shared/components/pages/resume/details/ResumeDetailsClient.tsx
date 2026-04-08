/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowDownToLine,
	Brain,
	Briefcase,
	CheckCircle2,
	CircleDot,
	FileSearch,
	FileText,
	Globe,
	GraduationCap,
	Lightbulb,
	Mail,
	MessageSquareQuote,
	Phone,
	Settings,
	ShieldAlert,
	Sparkles,
	Target,
	UserRound,
	XCircle,
	ExternalLink,
} from "lucide-react";
import {
	useResumeDetailsStore,
	type ResumeAnalysisGap,
	type ResumeAnalysisRedFlag,
	type ResumeAnalysisSkillItem,
	type ResumeAnalysisStrength,
} from "@/shared/store/pages/resume/useResumeDetailsStore";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import {
	EmptyStateText,
	MetaPill,
	SectionCard,
	SectionHeader,
	StatCard,
} from "./ResumeDetailsSections";
import { useSearchParams } from "next/navigation";

type HighlightItem = {
	title: string;
	description: string;
	evidence: string;
	job_relevance: string;
	ai_opinion: string;
};

type TopHighlightValue = HighlightItem | string | null | undefined;

type ActiveTab = "strengths" | "gaps" | "redFlags";

const getFitLabel = (score: number) => {
	if (score >= 75) return "Great fit";
	if (score >= 55) return "Good fit";
	if (score >= 40) return "Fair fit";
	return "Low fit";
};

const getRecommendationDisplay = (recommendation?: string | null) => {
	switch ((recommendation ?? "").toLowerCase()) {
		case "highly_recommended":
			return {
				label: "Highly Recommended",
				className: "bg-resume-success/90 text-white border-transparent",
			};
		case "recommended":
			return {
				label: "Recommended",
				className: "bg-resume-primary text-white border-transparent",
			};
		case "consider":
			return {
				label: "Review Required",
				className: "bg-resume-warning text-white border-transparent",
			};
		case "not_recommended":
			return {
				label: "Not Recommended",
				className: "bg-resume-danger text-white border-transparent",
			};
		default:
			return {
				label: "Pending Review",
				className: "bg-resume-surface-soft text-resume-text-strong",
			};
	}
};

const safeArray = <T,>(value: unknown): T[] =>
	Array.isArray(value) ? (value as T[]) : [];

const getInitials = (name: string) =>
	name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

const renderDate = (date?: string | null) => {
	if (!date) return "N/A";
	const parsed = new Date(date);
	if (Number.isNaN(parsed.getTime())) return "N/A";
	return parsed.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

const SkeletonBlock = ({ className }: { className: string }) => (
	<div className={`rounded-md bg-resume-surface-soft ${className}`} />
);

const SingleProfileLoadingSkeleton = () => (
	<div className="w-full space-y-6 animate-pulse">
		<SkeletonBlock className="h-9 w-56 rounded-xl" />
		<SectionCard className="p-5">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<SkeletonBlock className="h-14 w-14 rounded-2xl" />
					<div className="space-y-2.5">
						<SkeletonBlock className="h-6 w-52" />
						<SkeletonBlock className="h-4 w-32" />
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<SkeletonBlock className="h-9 w-24 rounded-xl" />
					<SkeletonBlock className="h-9 w-24 rounded-xl" />
					<SkeletonBlock className="h-9 w-28 rounded-xl" />
					<SkeletonBlock className="h-9 w-32 rounded-xl" />
				</div>
			</div>
		</SectionCard>
		<SectionCard className="p-4 md:p-5">
			<div className="flex items-center gap-2.5">
				<SkeletonBlock className="h-4 w-40" />
				<SkeletonBlock className="h-4 w-56" />
			</div>
		</SectionCard>
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<SectionCard className="space-y-3 overflow-hidden bg-linear-to-br from-resume-score-from to-resume-score-to text-white border-transparent">
				<SkeletonBlock className="h-4 w-24 bg-white/35" />
				<SkeletonBlock className="h-14 w-28 bg-white/45" />
				<SkeletonBlock className="h-4 w-24 bg-white/35" />
				<SkeletonBlock className="h-2 w-full rounded-full bg-white/30" />
			</SectionCard>
			<SectionCard className="space-y-3">
				<SkeletonBlock className="h-5 w-28" />
				<SkeletonBlock className="h-4 w-4/5" />
				<SkeletonBlock className="h-4 w-3/5" />
				<SkeletonBlock className="h-3 w-24" />
			</SectionCard>
			<SectionCard className="space-y-3">
				<SkeletonBlock className="h-5 w-24" />
				<div className="flex flex-wrap gap-2">
					<SkeletonBlock className="h-7 w-16 rounded-full" />
					<SkeletonBlock className="h-7 w-20 rounded-full" />
					<SkeletonBlock className="h-7 w-14 rounded-full" />
				</div>
			</SectionCard>
		</div>
		<SectionCard className="space-y-5">
			<SkeletonBlock className="h-5 w-48" />
			<div className="rounded-2xl bg-linear-to-r from-resume-summary-from to-resume-summary-to p-4">
				<div className="space-y-3">
					<SkeletonBlock className="h-4 w-full bg-white/35" />
					<div className="flex gap-2">
						<SkeletonBlock className="h-7 w-24 rounded-full bg-white/35" />
						<SkeletonBlock className="h-7 w-20 rounded-full bg-white/35" />
					</div>
				</div>
			</div>
			<div className="flex flex-wrap gap-2">
				<SkeletonBlock className="h-7 w-32 rounded-full" />
				<SkeletonBlock className="h-7 w-28 rounded-full" />
				<SkeletonBlock className="h-7 w-24 rounded-full" />
				<SkeletonBlock className="h-7 w-20 rounded-full" />
			</div>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4 space-y-2">
					<SkeletonBlock className="h-4 w-28" />
					<SkeletonBlock className="h-4 w-full" />
				</div>
				<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4 space-y-2">
					<SkeletonBlock className="h-4 w-28" />
					<SkeletonBlock className="h-4 w-full" />
				</div>
			</div>
			<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4 space-y-2">
				<SkeletonBlock className="h-4 w-28" />
				<SkeletonBlock className="h-3 w-full" />
				<SkeletonBlock className="h-3 w-4/5" />
			</div>
			<div className="grid grid-cols-3 gap-3">
				<SkeletonBlock className="h-24 rounded-2xl" />
				<SkeletonBlock className="h-24 rounded-2xl" />
				<SkeletonBlock className="h-24 rounded-2xl" />
			</div>
		</SectionCard>
		<SectionCard className="space-y-3">
			<SkeletonBlock className="h-5 w-44" />
			<SkeletonBlock className="h-4 w-full" />
			<SkeletonBlock className="h-4 w-11/12" />
		</SectionCard>
		<SectionCard className="space-y-3">
			<SkeletonBlock className="h-5 w-32" />
			<div className="flex flex-wrap gap-2">
				<SkeletonBlock className="h-7 w-20 rounded-full" />
				<SkeletonBlock className="h-7 w-24 rounded-full" />
				<SkeletonBlock className="h-7 w-16 rounded-full" />
			</div>
		</SectionCard>
	</div>
);

const HighlightCardItem = ({
	item,
	index,
	variant,
}: {
	item: HighlightItem;
	index: number;
	variant: "strength" | "gap" | "red_flag";
}) => {
	const cfg = {
		strength: {
			border: "border-resume-success/30",
			bg: "bg-resume-success/[0.06]",
			titleColor: "text-resume-success",
			indexBg: "bg-resume-stat-success-from",
		},
		gap: {
			border: "border-resume-warning/30",
			bg: "bg-resume-warning/[0.06]",
			titleColor: "text-resume-warning",
			indexBg: "bg-resume-stat-danger-from",
		},
		red_flag: {
			border: "border-resume-danger/30",
			bg: "bg-resume-danger/[0.06]",
			titleColor: "text-resume-danger",
			indexBg: "bg-resume-danger",
		},
	}[variant];

	return (
		<div
			className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4 transition-all duration-200 hover:shadow-sm`}
		>
			<div className="flex items-start gap-3">
				<div
					className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${cfg.indexBg} text-xs font-bold text-white shadow-sm`}
				>
					{index + 1}
				</div>
				<h4 className={`text-sm font-bold leading-snug ${cfg.titleColor}`}>
					{item.title}
				</h4>
			</div>

			<div className="mt-3 border-t border-resume-border" />

			{item.description?.trim() ? (
				<p className="mt-3 text-sm leading-relaxed text-resume-text-strong">
					{item.description}
				</p>
			) : null}

			{item.evidence?.trim() ? (
				<div className="mt-3 flex gap-2.5">
					<div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-teal-500/10">
						<FileSearch className="h-3 w-3 text-teal-600" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-teal-600">
							Evidence
						</p>
						<p className="text-xs italic leading-relaxed text-resume-text-muted">
							{item.evidence}
						</p>
					</div>
				</div>
			) : null}

			{item.job_relevance?.trim() ? (
				<div className="mt-3 flex gap-2.5">
					<div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-resume-primary/10">
						<Target className="h-3 w-3 text-resume-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-resume-primary">
							Job Relevance
						</p>
						<p className="text-xs font-semibold leading-relaxed text-resume-text-strong">
							{item.job_relevance}
						</p>
					</div>
				</div>
			) : null}

			{item.ai_opinion?.trim() ? (
				<div className="mt-3 flex gap-2.5">
					<div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-resume-secondary/10">
						<Brain className="h-3 w-3 text-resume-secondary" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-resume-secondary">
							AI Insight
						</p>
						<p className="text-xs leading-relaxed text-resume-text-muted">
							{item.ai_opinion}
						</p>
					</div>
				</div>
			) : null}
		</div>
	);
};

const HighlightCardList = ({
	items,
	variant,
	emptyText,
}: {
	items: HighlightItem[];
	variant: "strength" | "gap" | "red_flag";
	emptyText: string;
}) => {
	if (!items.length) {
		return <EmptyStateText text={emptyText} />;
	}
	return (
		<div
			className={`grid gap-3 ${items.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}
		>
			{items.map((item, index) => (
				<HighlightCardItem
					key={`${variant}-${index}-${item.title}`}
					item={item}
					index={index}
					variant={variant}
				/>
			))}
		</div>
	);
};

const TopHighlightCard = ({
	value,
	type,
}: {
	value: TopHighlightValue;
	type: "strength" | "concern";
}) => {
	const isStrength = type === "strength";
	const borderColor = isStrength
		? "border-resume-success/25"
		: "border-resume-danger/25";
	const bgColor = isStrength ? "bg-resume-success/10" : "bg-resume-danger/10";
	const labelColor = isStrength ? "text-resume-success" : "text-resume-danger";
	const label = isStrength ? "Top Strength" : "Top Concern";
	const Icon = isStrength ? CheckCircle2 : AlertTriangle;

	if (!value || typeof value === "string") {
		return (
			<div className={`rounded-2xl border ${borderColor} ${bgColor} p-4`}>
				<div
					className={`mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest ${labelColor}`}
				>
					<Icon className="h-4 w-4" />
					{label}
				</div>
				<p className="text-sm text-resume-text-strong">
					{value ?? "Not provided."}
				</p>
			</div>
		);
	}

	return (
		<div
			className={`rounded-2xl border ${borderColor} ${bgColor} p-4 space-y-1`}
		>
			<div
				className={`mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest ${labelColor}`}
			>
				<Icon className="h-4 w-4" />
				{label}
			</div>
			<p className={`text-sm font-bold ${labelColor}`}>{value.title}</p>
			{value.description ? (
				<p className="text-sm leading-relaxed text-resume-text-strong">
					{value.description}
				</p>
			) : null}
			{value.evidence ? (
				<div className="flex gap-2 pt-1">
					<FileSearch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
					<p className="text-xs italic text-resume-text-muted">
						{value.evidence}
					</p>
				</div>
			) : null}
			{value.job_relevance ? (
				<div className="flex gap-2 pt-1">
					<Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-resume-primary" />
					<p className="text-xs font-semibold text-resume-text-strong">
						{value.job_relevance}
					</p>
				</div>
			) : null}
			{value.ai_opinion ? (
				<div className="flex gap-2 pt-1">
					<Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-resume-secondary" />
					<p className="text-xs text-resume-text-muted">{value.ai_opinion}</p>
				</div>
			) : null}
		</div>
	);
};

const normalizeTopHighlight = (value: unknown): TopHighlightValue => {
	if (!value) return null;
	if (typeof value === "string") return value;
	if (typeof value === "object" && !Array.isArray(value)) {
		const obj = value as Record<string, unknown>;
		if (typeof obj.title === "string" || typeof obj.description === "string") {
			return {
				title: (obj.title as string) ?? "",
				description: (obj.description as string) ?? "",
				evidence: (obj.evidence as string) ?? "",
				job_relevance: (obj.job_relevance as string) ?? "",
				ai_opinion: (obj.ai_opinion as string) ?? "",
			};
		}
	}
	return null;
};

const ResumeDetailsClient = ({ resumeId }: { resumeId: number | string }) => {
	const searchParams = useSearchParams();

	const preSelectedAccountId = useMemo(() => {
		const param = searchParams.get("accountId")?.trim();
		if (!param) return "";
		return Number.isFinite(Number(param)) ? param : "";
	}, [searchParams]);
	const {
		resume,
		loading,
		actionLoading,
		getResume,
		denyResume,
		shortlistResume,
		inviteResume,
	} = useResumeDetailsStore();
	const [activeTab, setActiveTab] = useState<ActiveTab>("strengths");

	useEffect(() => {
		getResume(resumeId);
	}, [getResume, resumeId]);

	if (loading || !resume) {
		return <SingleProfileLoadingSkeleton />;
	}

	const structured = resume.resume_structured?.data ?? null;
	const analysis = resume.resume_analysis;
	const recommendationDisplay = getRecommendationDisplay(
		analysis?.recommendation
	);

	const score = analysis?.score ?? 0;
	const review = analysis?.review ?? null;

	const strengths = safeArray<ResumeAnalysisStrength>(analysis?.strengths);
	const gaps = safeArray<ResumeAnalysisGap>(analysis?.gaps);
	const redFlags = safeArray<ResumeAnalysisRedFlag>(analysis?.red_flags);

	const matchedSkills = safeArray<string>(analysis?.matched_skills);
	const missingSkills = safeArray<string>(analysis?.missing_skills);
	const groupedSkills = analysis?.skills;
	const groupedExperience = analysis?.experience;
	const quantifiedAchievements = safeArray<{
		achievement?: string;
		metric?: string;
		category?: string;
	}>(analysis?.quantified_achievements);

	const contactEmail =
		structured?.contact?.email ?? resume.resume_structured?.email ?? "No email";
	const contactPhone =
		structured?.contact?.phone ?? resume.resume_structured?.phone ?? "No phone";
	const profileTagline =
		analysis?.profile_tagline ??
		review?.description ??
		analysis?.summary ??
		"Summary is not generated yet.";
	const summaryParagraph =
		analysis?.analysis_summary_paragraph ??
		analysis?.summary ??
		"No summary generated.";

	const strengthsCount =
		strengths.length ||
		(typeof analysis?.strengths_count === "number"
			? analysis.strengths_count
			: 0);
	const gapsCount =
		gaps.length ||
		(typeof analysis?.gaps_count === "number" ? analysis.gaps_count : 0);
	const matchedCount = (() => {
		if (
			typeof analysis?.matched_count === "number" &&
			analysis.matched_count > 0
		)
			return analysis.matched_count;
		const fromSkillItems = [
			...safeArray(groupedSkills?.matched?.direct_match),
			...safeArray(groupedSkills?.matched?.semantic_match),
		].length;
		if (fromSkillItems > 0) return fromSkillItems;
		const fromTechnical = safeArray<string>(
			analysis?.matched_technical_skills
		).length;
		if (fromTechnical > 0) return fromTechnical;
		return strengthsCount;
	})();

	const dealbreakers = safeArray<string>(
		review?.dealbreakers ?? analysis?.dealbreakers
	);
	const skillDepth = safeArray<{
		skill?: string;
		depth?: string;
		evidence?: string | null;
	}>(analysis?.skill_depth);
	const appliedDate = renderDate(resume.created_at);

	const topStrength = normalizeTopHighlight(
		review?.top_strength ?? analysis?.top_strength
	);
	const topConcern = normalizeTopHighlight(
		review?.top_concern ?? analysis?.top_concern
	);

	const strengthDetails: HighlightItem[] = strengths.map((item) => {
		const s = item as any;
		if (typeof s === "string")
			return {
				title: s,
				description: "",
				evidence: "",
				job_relevance: "",
				ai_opinion: "",
			};
		return {
			title: s.title ?? s.name ?? "Strength",
			description: s.description ?? "",
			evidence: s.evidence ?? "",
			job_relevance: s.job_relevance ?? "",
			ai_opinion: s.ai_opinion ?? "",
		};
	});

	const gapDetails: HighlightItem[] = gaps.map((gap) => {
		const g = gap as any;
		return {
			title: g.title || g.why_gap || g.job_requirement || "Gap detected",
			description: g.description ?? "",
			evidence: g.evidence ?? "",
			job_relevance: g.job_relevance ?? "",
			ai_opinion: g.ai_opinion ?? "",
		};
	});

	const redFlagDetails: HighlightItem[] = redFlags.map((flag) => ({
		title: (flag as any).title || (flag as any).type || "Red flag",
		description: (flag as any).description ?? "",
		evidence: (flag as any).evidence ?? "",
		job_relevance: (flag as any).job_relevance ?? "",
		ai_opinion: (flag as any).ai_opinion ?? "",
	}));

	const matchedSkillItems = [
		...safeArray<ResumeAnalysisSkillItem>(groupedSkills?.matched?.direct_match),
		...safeArray<ResumeAnalysisSkillItem>(
			groupedSkills?.matched?.semantic_match
		),
	];
	const missingSkillItems = safeArray<ResumeAnalysisSkillItem>(
		groupedSkills?.missing
	);

	const tabConfig: {
		key: ActiveTab;
		label: string;
		count: number;
		activeClass: string;
		countClass: string;
	}[] = [
		{
			key: "strengths",
			label: "Strengths",
			count: strengthsCount,
			activeClass:
				"border-resume-success text-resume-success bg-resume-success/10",
			countClass: "bg-resume-success/20 text-resume-success",
		},
		{
			key: "gaps",
			label: "Gaps",
			count: gapsCount,
			activeClass:
				"border-resume-warning text-resume-warning bg-resume-warning/10",
			countClass: "bg-resume-warning/20 text-resume-warning",
		},
		{
			key: "redFlags",
			label: "Red Flags",
			count: redFlagDetails.length,
			activeClass:
				"border-resume-danger text-resume-danger bg-resume-danger/10",
			countClass: "bg-resume-danger/20 text-resume-danger",
		},
	];

	return (
		<div className="w-full space-y-6">
			<Link
				href={`/resumes?accountId=${preSelectedAccountId}`}
				className="inline-flex items-center gap-2 rounded-xl border border-resume-border bg-resume-surface-soft px-3 py-2 text-sm font-semibold text-resume-text-muted transition-colors hover:bg-resume-surface hover:text-resume-text-strong"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Resumes
			</Link>

			{!resume.resume_analysis && !resume.resume_structured && (
				<div className="flex items-start gap-3 rounded-2xl border border-resume-warning/30 bg-resume-warning/6 px-4 py-3.5">
					<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-resume-warning" />
					<div>
						<p className="text-sm font-semibold text-resume-text-strong">
							Resume not analyzed yet
						</p>
						<p className="mt-0.5 text-sm text-resume-text-muted">
							This resume has been uploaded but hasn&apos;t been processed by AI
							yet. Analysis and structured data will appear here once processing
							is complete.
						</p>
					</div>
				</div>
			)}

			<div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-resume-surface p-5 shadow-sm">
				<div className="flex items-center gap-4">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-resume-primary text-xl font-black text-white">
						{getInitials(structured?.name ?? resume.name)}
					</div>
					<div>
						<h1 className="text-2xl font-black text-resume-text-strong">
							{structured?.name ?? resume.name}
						</h1>
						<p className="text-sm text-resume-text-muted">Resume Analysis</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant={resume.auto_shortlisted ? "secondary" : "outline"}
						size="sm"
						className="rounded-xl"
						disabled={actionLoading === "shortlist"}
						onClick={() =>
							shortlistResume(
								resume.id,
								!resume.auto_shortlisted,
								preSelectedAccountId
							)
						}
					>
						{resume.auto_shortlisted ? "Shortlisted" : "Shortlist"}
					</Button>
					<Button
						variant={resume.auto_denied ? "destructive" : "outline"}
						size="sm"
						className="rounded-xl"
						disabled={actionLoading === "deny"}
						onClick={() =>
							denyResume(resume.id, !resume.auto_denied, preSelectedAccountId)
						}
					>
						{resume.auto_denied ? "Denied" : "Deny"}
					</Button>
					<Tooltip content={null}>
						<Button
							size="sm"
							disabled={actionLoading === "invite"}
							onClick={() => inviteResume(resume.id, preSelectedAccountId)}
							className="rounded-xl bg-resume-primary text-white hover:bg-resume-primary/90"
						>
							Send Invitation
						</Button>
					</Tooltip>
					<Button
						size="sm"
						className="rounded-xl border-none bg-resume-primary text-white hover:bg-resume-primary/90"
						asChild
					>
						<a
							href={`${process.env.NEXT_PUBLIC_FILES_RESUME}/${resume.link}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ArrowDownToLine className="mr-1.5 h-4 w-4" />
							View Resume
						</a>
					</Button>
				</div>
			</div>

			<SectionCard className="p-4 md:p-5">
				<div className="flex flex-wrap items-center gap-2 text-sm">
					<Target className="h-4 w-4 text-resume-primary" />
					<span className="text-resume-text-muted">
						Analyzing for position:
					</span>
					<span className="font-semibold text-resume-text-strong">
						{resume.job?.title ?? "Not specified"}
					</span>
				</div>
			</SectionCard>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<SectionCard className="overflow-hidden bg-linear-to-br from-resume-score-from to-resume-score-to text-white border-transparent">
					<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/85">
						<Target className="h-4 w-4" />
						Match Score
					</div>
					<p className="mt-3 text-6xl font-black">{score}%</p>
					<p className="mt-2 text-sm font-semibold uppercase text-white/90">
						{(analysis as any)?.fit_label ?? getFitLabel(score)}
					</p>
					<div className="mt-6 h-2 w-full rounded-full bg-white/25">
						<div
							className="h-full rounded-full bg-white transition-all"
							style={{ width: `${Math.min(score, 100)}%` }}
						/>
					</div>
				</SectionCard>

				<SectionCard>
					<SectionHeader icon={UserRound} title="Contact Info" />
					<div className="space-y-3 text-sm text-resume-text-muted">
						<div className="flex items-center gap-2.5">
							<Mail className="h-4 w-4 text-resume-primary" />
							<span className="truncate">{contactEmail}</span>
						</div>
						<div className="flex items-center gap-2.5">
							<Phone className="h-4 w-4 text-resume-success" />
							<span>{contactPhone}</span>
						</div>
						<p className="pt-1 text-xs">Added {appliedDate}</p>
					</div>
				</SectionCard>

				<SectionCard>
					<SectionHeader icon={Globe} title="Languages" />
					<div className="flex flex-wrap gap-2">
						{(() => {
							const fromLanguages = safeArray<string>(structured?.languages);
							const fromDetailed = safeArray<{
								name?: string | null;
								level?: string | null;
							}>(structured?.languages_detailed);
							if (fromLanguages.length) {
								return fromLanguages.map((lang, index) => (
									<MetaPill key={`${lang}-${index}`}>{lang}</MetaPill>
								));
							}
							if (fromDetailed.length) {
								return fromDetailed.map((item, index) => (
									<MetaPill key={`${item.name ?? "lang"}-${index}`}>
										{item.name ?? "Unknown"}
										{item.level ? ` · ${item.level}` : ""}
									</MetaPill>
								));
							}
							return <EmptyStateText text="No languages specified" />;
						})()}
					</div>
				</SectionCard>
			</div>

			<SectionCard>
				<SectionHeader
					icon={MessageSquareQuote}
					title="Analysis Summary"
					iconClassName="bg-resume-primary/15"
				/>
				<p className="text-base font-medium leading-relaxed text-resume-text-muted">
					{summaryParagraph}
				</p>
			</SectionCard>

			<SectionCard>
				<SectionHeader
					icon={Brain}
					title="AI Analysis Report"
					subtitle="Comprehensive candidate evaluation"
					iconClassName="bg-resume-secondary/15"
				/>
				<div className="space-y-5">
					<div className="rounded-2xl bg-linear-to-r from-resume-summary-from to-resume-summary-to p-4 text-white">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p className="text-sm font-semibold">{profileTagline}</p>
							<div className="flex flex-wrap items-center gap-2">
								{analysis?.seniority_fit ? (
									<MetaPill className="border-none bg-white/20 text-white">
										{analysis.seniority_fit}
									</MetaPill>
								) : null}
								{analysis?.job_type ? (
									<MetaPill className="border-none bg-white/20 text-white">
										{analysis.job_type}
									</MetaPill>
								) : null}
							</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<MetaPill className={recommendationDisplay.className}>
							{(analysis as any)?.recommendation_label ??
								recommendationDisplay.label}
						</MetaPill>
						{((analysis as any)?.confidence_label ?? analysis?.confidence) ? (
							<MetaPill>
								{(analysis as any)?.confidence_label ?? analysis?.confidence}{" "}
								Confidence
							</MetaPill>
						) : null}
						{((analysis as any)?.risk_label ?? analysis?.risk_level) ? (
							<MetaPill>
								{(analysis as any)?.risk_label ?? analysis?.risk_level} Risk
							</MetaPill>
						) : null}
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<TopHighlightCard value={topStrength} type="strength" />
						<TopHighlightCard value={topConcern} type="concern" />
					</div>

					{dealbreakers.length > 0 ? (
						<div className="rounded-2xl border border-resume-danger/25 bg-resume-danger/10 p-4">
							<div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-resume-danger">
								<XCircle className="h-4 w-4" />
								Dealbreakers
							</div>
							<ul className="space-y-1 text-sm text-resume-text-strong">
								{dealbreakers.map((item, index) => (
									<li
										key={`${item}-${index}`}
										className="flex items-start gap-2"
									>
										<CircleDot className="mt-0.5 h-3.5 w-3.5 text-resume-danger" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
					) : null}

					<div className="grid grid-cols-3 gap-3">
						{tabConfig.map((tab) => (
							<button
								key={tab.key}
								onClick={() => setActiveTab(tab.key)}
								className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all duration-150 ${
									activeTab === tab.key
										? tab.activeClass
										: "border-resume-border bg-resume-surface-soft text-resume-text-muted hover:border-resume-border/60 hover:bg-resume-surface"
								}`}
							>
								<span>{tab.label}</span>
								<span
									className={`ml-2 rounded-lg px-2 py-0.5 text-xs font-black ${activeTab === tab.key ? tab.countClass : "bg-resume-border/40 text-resume-text-muted"}`}
								>
									{tab.count}
								</span>
							</button>
						))}
					</div>

					<div className="pt-1">
						{activeTab === "strengths" && (
							<HighlightCardList
								items={strengthDetails}
								variant="strength"
								emptyText="No strengths identified."
							/>
						)}
						{activeTab === "gaps" && (
							<HighlightCardList
								items={gapDetails}
								variant="gap"
								emptyText="No gaps identified."
							/>
						)}
						{activeTab === "redFlags" && (
							<HighlightCardList
								items={redFlagDetails}
								variant="red_flag"
								emptyText="No red flags reported."
							/>
						)}
					</div>

					{/* Required Documents section */}
					{resume.application?.documents &&
						resume.application.documents.length > 0 && (
							<div className="rounded-[15px] border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
								<h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
									Required Documents
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{resume.application.documents.map((doc) => (
										<a
											key={doc.id}
											href={`${process.env.NEXT_PUBLIC_AGENCY_API_URL}${doc.link}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
										>
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
												<FileText size={20} />
											</div>
											<div className="min-w-0">
												<p className="text-sm font-bold text-slate-900 dark:text-white truncate">
													{doc.name}
												</p>
												<p className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
													View Document
												</p>
											</div>
											<ExternalLink
												size={14}
												className="ml-auto text-slate-400"
											/>
										</a>
									))}
								</div>
							</div>
						)}
				</div>
			</SectionCard>

			<SectionCard>
				<SectionHeader
					icon={Settings}
					title="Skills Matching"
					iconClassName="bg-resume-secondary/15"
				/>
				<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
					<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4">
						<p className="mb-3 text-xs font-bold uppercase tracking-wide text-resume-text-muted">
							Matched Skills (Direct + Semantic)
						</p>
						{matchedSkillItems.length ? (
							<ul className="space-y-2 text-sm text-resume-text-muted">
								{matchedSkillItems.map((item, index) => (
									<li
										key={`${item.skill ?? "matched"}-${index}`}
										className="rounded-xl border border-resume-border bg-resume-surface p-3 space-y-1"
									>
										<p className="font-semibold text-resume-text-strong">
											{item.skill ?? "Skill"}
										</p>
										{item.evidence ? (
											<p>
												<span className="font-medium text-resume-text-strong">
													Evidence:
												</span>{" "}
												{item.evidence}
											</p>
										) : null}
										{item.job_relevance ? (
											<p>
												<span className="font-medium text-resume-primary">
													Job Relevance:
												</span>{" "}
												{item.job_relevance}
											</p>
										) : null}
										{item.ai_opinion ? (
											<p>
												<span className="font-medium text-resume-text-muted">
													AI Opinion:
												</span>{" "}
												{item.ai_opinion}
											</p>
										) : null}
									</li>
								))}
							</ul>
						) : (
							(() => {
								const fromTechnical = safeArray<string>(
									analysis?.matched_technical_skills
								);
								const fromCrossover = safeArray<string>(
									(analysis as any)?.domain_match?.crossover_skills
								);
								const skills = Array.from(
									new Set([...fromTechnical, ...fromCrossover])
								);
								if (skills.length) {
									return (
										<ul className="space-y-2">
											{skills.map((skill, index) => (
												<li
													key={`${skill}-${index}`}
													className="rounded-xl border border-resume-success/20 bg-resume-success/5 p-3"
												>
													<p className="text-sm font-semibold text-resume-success">
														{skill}
													</p>
													<p className="mt-0.5 text-xs text-resume-text-muted">
														Matched from domain analysis
													</p>
												</li>
											))}
										</ul>
									);
								}
								return <EmptyStateText text="No matched skills identified." />;
							})()
						)}
					</div>
					<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4">
						<p className="mb-3 text-xs font-bold uppercase tracking-wide text-resume-text-muted">
							Missing Skills
						</p>
						{missingSkillItems.length ? (
							<ul className="space-y-2 text-sm text-resume-text-muted">
								{missingSkillItems.map((item, index) => (
									<li
										key={`${item.skill ?? "missing"}-${index}`}
										className="rounded-xl border border-resume-danger/20 bg-resume-danger/5 p-3 space-y-1"
									>
										<p className="font-semibold text-resume-danger">
											{item.skill ?? "Skill"}
										</p>
										{item.evidence ? (
											<p>
												<span className="font-medium text-resume-text-strong">
													Evidence:
												</span>{" "}
												{item.evidence}
											</p>
										) : null}
										{item.job_relevance ? (
											<p>
												<span className="font-medium text-resume-primary">
													Job Relevance:
												</span>{" "}
												{item.job_relevance}
											</p>
										) : null}
										{item.ai_opinion ? (
											<p>
												<span className="font-medium text-resume-text-muted">
													AI Opinion:
												</span>{" "}
												{item.ai_opinion}
											</p>
										) : null}
									</li>
								))}
							</ul>
						) : safeArray<string>(analysis?.missing_technical_skills).length ? (
							<div className="flex flex-wrap gap-2">
								{safeArray<string>(analysis?.missing_technical_skills).map(
									(skill, index) => (
										<MetaPill
											key={`${skill}-${index}`}
											className="bg-resume-danger/10 text-resume-danger border-resume-danger/20"
										>
											{skill}
										</MetaPill>
									)
								)}
							</div>
						) : (
							<EmptyStateText text="No missing skills identified." />
						)}
					</div>
				</div>
			</SectionCard>

			<SectionCard>
				<SectionHeader
					icon={Briefcase}
					title="Experience Alignment"
					iconClassName="bg-resume-primary/15"
				/>
				<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
					<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4">
						<p className="mb-2 text-xs font-bold uppercase tracking-wide text-resume-text-muted">
							Total Experience
						</p>
						{safeArray<{
							role?: string;
							company?: string;
							start?: string;
							end?: string;
							description?: string;
						}>(groupedExperience?.total_experience).length ? (
							<ul className="space-y-3 text-sm text-resume-text-muted">
								{safeArray<{
									role?: string;
									company?: string;
									start?: string;
									end?: string;
									description?: string;
								}>(groupedExperience?.total_experience).map((item, index) => (
									<li
										key={`${item.role ?? "total"}-${index}`}
										className="border-b border-resume-border pb-3 last:border-0 last:pb-0"
									>
										<p className="font-semibold text-resume-text-strong">
											{item.role ?? "Role"}
											{item.company ? ` @ ${item.company}` : ""}
										</p>
										<p className="text-xs">
											{item.start ?? "?"} – {item.end ?? "?"}
										</p>
										{item.description ? (
											<p className="mt-1 text-xs">{item.description}</p>
										) : null}
									</li>
								))}
							</ul>
						) : (
							<EmptyStateText text="No total experience details." />
						)}
					</div>
					<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4">
						<p className="mb-2 text-xs font-bold uppercase tracking-wide text-resume-text-muted">
							Domain Experience
						</p>
						{safeArray<{
							role?: string;
							company?: string;
							start?: string;
							end?: string;
							description?: string;
							explanation?: string;
						}>(groupedExperience?.domain_experience).length ? (
							<ul className="space-y-3 text-sm text-resume-text-muted">
								{safeArray<{
									role?: string;
									company?: string;
									start?: string;
									end?: string;
									description?: string;
									explanation?: string;
								}>(groupedExperience?.domain_experience).map((item, index) => (
									<li
										key={`${item.role ?? "domain"}-${index}`}
										className="border-b border-resume-border pb-3 last:border-0 last:pb-0"
									>
										<p className="font-semibold text-resume-text-strong">
											{item.role ?? "Role"}
											{item.company ? ` @ ${item.company}` : ""}
										</p>
										<p className="text-xs">
											{item.start ?? "?"} – {item.end ?? "?"}
										</p>
										{item.description ? (
											<p className="mt-1 text-xs">{item.description}</p>
										) : null}
										{item.explanation ? (
											<p className="mt-1 text-xs font-medium text-resume-primary">
												{item.explanation}
											</p>
										) : null}
									</li>
								))}
							</ul>
						) : (
							<EmptyStateText text="No domain-aligned experience found." />
						)}
					</div>
					<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4">
						<p className="mb-2 text-xs font-bold uppercase tracking-wide text-resume-text-muted">
							Job Time Frame
						</p>
						{safeArray<{
							role?: string;
							company?: string;
							start?: string;
							end?: string;
							duration?: string;
						}>(groupedExperience?.job_time_frame).length ? (
							<ul className="space-y-3 text-sm text-resume-text-muted">
								{safeArray<{
									role?: string;
									company?: string;
									start?: string;
									end?: string;
									duration?: string;
								}>(groupedExperience?.job_time_frame).map((item, index) => (
									<li
										key={`${item.role ?? "frame"}-${index}`}
										className="border-b border-resume-border pb-3 last:border-0 last:pb-0"
									>
										<p className="font-semibold text-resume-text-strong">
											{item.role ?? "Role"}
											{item.company ? ` @ ${item.company}` : ""}
										</p>
										<p className="text-xs">
											{item.start ?? "?"} – {item.end ?? "?"}
										</p>
										{item.duration ? (
											<p className="mt-1 text-xs font-medium text-resume-primary">
												Duration: {item.duration}
											</p>
										) : null}
									</li>
								))}
							</ul>
						) : (
							<EmptyStateText text="No time-frame analysis available." />
						)}
					</div>
				</div>
			</SectionCard>

			<SectionCard>
				<SectionHeader
					icon={Sparkles}
					title="Quantified Achievements"
					iconClassName="bg-resume-success/15"
				/>
				{quantifiedAchievements.length ? (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						{quantifiedAchievements.map((item, index) => (
							<div
								key={`${item.achievement ?? "achievement"}-${index}`}
								className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4"
							>
								<p className="text-sm font-semibold text-resume-text-strong">
									{item.achievement ?? "Achievement"}
								</p>
								{item.metric ? (
									<p className="mt-1 text-sm font-bold text-resume-primary">
										Metric: {item.metric}
									</p>
								) : null}
								{item.category ? (
									<p className="mt-1 text-xs text-resume-text-muted">
										Category: {item.category}
									</p>
								) : null}
							</div>
						))}
					</div>
				) : (
					<EmptyStateText text="No quantified achievements extracted." />
				)}
			</SectionCard>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<SectionCard>
					<SectionHeader
						icon={ShieldAlert}
						title="Risk & Validation"
						iconClassName="bg-resume-danger/15"
					/>
					<div className="space-y-3 text-sm text-resume-text-muted">
						{(analysis as any)?.domain_match?.verdict ? (
							<p>
								<span className="font-semibold text-resume-text-strong">
									Domain Verdict:
								</span>{" "}
								{(analysis as any).domain_match.verdict}
							</p>
						) : null}
						{(analysis as any)?.experience_validation ? (
							<div className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4 space-y-1">
								<p className="text-xs font-bold uppercase tracking-wide text-resume-text-muted">
									Experience Validation
								</p>
								{(analysis as any).experience_validation
									.meets_experience_requirement !== null && (
									<p>
										<span className="font-semibold text-resume-text-strong">
											Meets Requirement:
										</span>{" "}
										<span
											className={
												(analysis as any).experience_validation
													.meets_experience_requirement
													? "text-resume-success"
													: "text-resume-danger"
											}
										>
											{(analysis as any).experience_validation
												.meets_experience_requirement
												? "Yes"
												: "No"}
										</span>
									</p>
								)}
								{safeArray<string>(
									(analysis as any).experience_validation.gaps_detected
								).length ? (
									<p>
										<span className="font-semibold text-resume-text-strong">
											Gaps Detected:
										</span>{" "}
										{safeArray<string>(
											(analysis as any).experience_validation.gaps_detected
										).join(", ")}
									</p>
								) : null}
							</div>
						) : null}
					</div>
				</SectionCard>

				<SectionCard>
					<SectionHeader
						icon={Target}
						title="Skill Depth"
						iconClassName="bg-resume-primary/15"
					/>
					{(() => {
						const depthItems = skillDepth.length
							? skillDepth
							: (() => {
									const matched = Array.from(
										new Set([
											...safeArray<string>(
												(analysis as any)?.domain_match?.crossover_skills
											),
											...safeArray<string>(analysis?.matched_technical_skills),
										])
									);
									const missing = Array.from(
										new Set(
											safeArray<string>(analysis?.missing_technical_skills)
										)
									);
									const derived: {
										skill: string;
										depth: string;
										evidence: string | null;
									}[] = [];
									matched.forEach((s) =>
										derived.push({
											skill: s,
											depth: "proficient",
											evidence: null,
										})
									);
									missing.forEach((s) =>
										derived.push({ skill: s, depth: "missing", evidence: null })
									);
									return derived;
								})();
						if (!depthItems.length)
							return (
								<EmptyStateText text="No skill depth analysis available." />
							);
						return (
							<ul className="space-y-2">
								{depthItems.map((item, index) => {
									const depthColor =
										item.depth === "expert"
											? "text-resume-success"
											: item.depth === "proficient"
												? "text-resume-primary"
												: item.depth === "familiar"
													? "text-resume-warning"
													: item.depth === "missing"
														? "text-resume-danger"
														: "text-resume-text-muted";
									return (
										<li
											key={`${index}-${item.skill ?? "skill"}`}
											className="flex items-start gap-2 rounded-xl border border-resume-border bg-resume-surface-soft p-3"
										>
											<CircleDot
												className={`mt-0.5 h-4 w-4 shrink-0 ${depthColor}`}
											/>
											<div className="min-w-0 flex-1">
												<span className="text-sm font-semibold text-resume-text-strong">
													{item.skill ?? "Unknown skill"}
												</span>
												<span
													className={`ml-2 text-xs font-bold ${depthColor}`}
												>
													{item.depth ?? "unknown"}
												</span>
												{item.evidence ? (
													<p className="mt-0.5 text-xs text-resume-text-muted">
														{item.evidence}
													</p>
												) : null}
											</div>
										</li>
									);
								})}
							</ul>
						);
					})()}
				</SectionCard>
			</div>

			<div className="flex flex-col *:flex-1 gap-4">
				<SectionCard>
					<SectionHeader
						icon={Settings}
						title="Technical Skills"
						iconClassName="bg-resume-secondary/15"
					/>
					<div className="flex flex-wrap gap-2">
						{(() => {
							const fromStructured = safeArray<string>(structured?.skills);
							if (fromStructured.length) {
								return fromStructured.map((skill, index) => (
									<MetaPill
										key={`${skill}-${index}`}
										className="bg-linear-to-br from-resume-chip-from to-resume-chip-to"
									>
										{skill}
									</MetaPill>
								));
							}
							const fromCrossover = safeArray<string>(
								(analysis as any)?.domain_match?.crossover_skills
							);
							const fromMatched = safeArray<string>(
								analysis?.matched_technical_skills
							);
							const derived = Array.from(
								new Set([...fromCrossover, ...fromMatched])
							);
							if (derived.length) {
								return derived.map((skill, index) => (
									<MetaPill
										key={`${skill}-${index}`}
										className="bg-linear-to-br from-resume-chip-from to-resume-chip-to"
									>
										{skill}
									</MetaPill>
								));
							}
							return <EmptyStateText text="No technical skills found." />;
						})()}
					</div>
				</SectionCard>

				<SectionCard>
					<SectionHeader
						icon={Briefcase}
						title="Work Experience"
						iconClassName="bg-resume-primary/15"
					/>
					<div className="space-y-4">
						{safeArray<{
							title?: string | null;
							company?: string | null;
							start_year?: number | null;
							end_year?: number | "Present" | null;
							highlights?: string[];
						}>(structured?.experience).length ? (
							safeArray<{
								title?: string | null;
								company?: string | null;
								start_year?: number | null;
								end_year?: number | "Present" | null;
								highlights?: string[];
							}>(structured?.experience).map((exp, index) => (
								<div
									key={`${exp.title ?? "role"}-${index}`}
									className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4"
								>
									<div className="flex flex-wrap items-start justify-between gap-2">
										<div>
											<p className="text-base font-semibold text-resume-text-strong">
												{exp.title ?? "Untitled role"}
											</p>
											<p className="text-sm text-resume-primary">
												{exp.company ?? "Unknown company"}
											</p>
										</div>
										<MetaPill>
											{exp.start_year ?? "?"} - {exp.end_year ?? "?"}
										</MetaPill>
									</div>
									{safeArray<string>(exp.highlights).length ? (
										<p className="mt-3 text-sm text-resume-text-muted">
											{safeArray<string>(exp.highlights).join(". ")}
										</p>
									) : null}
								</div>
							))
						) : (
							<EmptyStateText text="No work experience extracted." />
						)}
					</div>
				</SectionCard>

				<SectionCard>
					<SectionHeader
						icon={GraduationCap}
						title="Education"
						iconClassName="bg-resume-secondary/15"
					/>
					<div className="space-y-4">
						{safeArray<{
							degree?: string | null;
							institution?: string | null;
							year?: number | null;
							gpa?: string | null;
						}>(structured?.education).length ? (
							safeArray<{
								degree?: string | null;
								institution?: string | null;
								year?: number | null;
								gpa?: string | null;
							}>(structured?.education).map((edu, index) => (
								<div
									key={`${edu.degree ?? "edu"}-${index}`}
									className="rounded-2xl border border-resume-border bg-resume-surface-soft p-4"
								>
									<p className="text-base font-semibold text-resume-text-strong">
										{edu.degree ?? "Degree not specified"}
									</p>
									<p className="text-sm text-resume-primary">
										{edu.gpa ?? "GPA not specified"}
									</p>
									<p className="text-sm text-resume-primary">
										{edu.institution ?? "Institution not specified"}
									</p>
									<p className="mt-1 text-xs text-resume-text-muted">
										Year: {edu.year ?? "N/A"}
									</p>
								</div>
							))
						) : (
							<EmptyStateText text="No education records extracted." />
						)}
					</div>
				</SectionCard>
			</div>
		</div>
	);
};

export default ResumeDetailsClient;
