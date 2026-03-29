/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import {
	ArrowDownToLine,
	ArrowLeft,
	Briefcase,
	CalendarDays,
	Mail,
	MapPin,
	Phone,
	ScrollText,
	Users,
} from "lucide-react";
import clsx from "clsx";
import {
	useResumeDetailsStore,
	type ResumeDetails,
	type ResumeAnalysisGap,
	type ResumeAnalysisStrength,
} from "@/shared/store/pages/resume/useResumeDetailsStore";
import { SectionCard } from "./ResumeDetailsSections";
import Link from "next/link";

// ─── Mock data (shown when API returns no resume) ─────────────────────────────

const MOCK_RESUME: ResumeDetails = {
	id: 0,
	name: "sarah_johnson_resume.pdf",
	link: "#",
	created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
	auto_denied: false,
	auto_shortlisted: true,
	auto_invited: false,
	application_status: "shortlisted",
	job: { title: "Senior Frontend Developer" },
	resume_structured: {
		data: {
			name: "Sarah Johnson",
			contact: {
				email: "sarah.johnson@email.com",
				phone: "+1 (555) 123-4567",
				linkedin: "linkedin.com/in/sarahjohnson",
				github: "github.com/sarahjohnson",
			},
			location: { city: "San Francisco", country: "United States" },
			current_title: "Senior Frontend Developer",
			total_experience_years: 6,
			skills: [
				"React",
				"TypeScript",
				"Next.js",
				"GraphQL",
				"Tailwind CSS",
				"Node.js",
				"AWS",
				"Docker",
			],
			tools: ["Figma", "Git", "Jira", "Vite", "Webpack"],
			languages: ["English", "Spanish"],
			education: [
				{
					degree: "BS Computer Science",
					institution: "Stanford University",
					year: 2018,
					country: "United States",
				},
			],
			experience: [
				{
					title: "Senior Frontend Engineer",
					company: "TechCorp Inc.",
					start_year: 2021,
					end_year: "Present",
					highlights: [
						"Led migration from CRA to Next.js reducing load time by 40%",
						"Mentored 3 junior engineers",
					],
				},
				{
					title: "Frontend Developer",
					company: "StartupXYZ",
					start_year: 2018,
					end_year: 2021,
					highlights: [
						"Built real-time dashboard with React + WebSockets",
						"Reduced bundle size by 30% through code splitting",
					],
				},
			],
			certifications: [
				{ name: "AWS Certified Developer", issuer: "Amazon", year: 2022 },
			],
		},
		email: "sarah.johnson@email.com",
		phone: "+1 (555) 123-4567",
		current_title: "Senior Frontend Developer",
		city: "San Francisco",
		country: "United States",
		total_experience_years: 6,
		languages: ["English", "Spanish"],
		language_levels: ["Native", "Intermediate"],
		top_degree: "BS Computer Science",
		top_institution: "Stanford University",
	},
	resume_analysis: {
		score: 95,
		job_type: "TECHNICAL",
		score_breakdown: {
			role_fit_and_core_skills: 95,
			experience_impact: 92,
			performance_productivity: 90,
			retention_engagement_indicators: 88,
			leadership_collaboration: 85,
			education_certifications: 95,
			projects_initiative: 97,
		},
		recommendation: "highly_recommended",
		confidence: "HIGH",
		risk_level: "LOW",
		seniority_level: "Mid Level",
		seniority_fit: "MATCHED",
		dealbreakers: [],
		profile_tagline:
			"Experienced frontend developer with a passion for creating intuitive user interfaces. Proven track record of leading teams and delivering high-quality products.",
		summary:
			"Experienced frontend developer with a passion for creating intuitive user interfaces. Proven track record of leading teams and delivering high-quality products.",
		analysis_summary_paragraph:
			"Experienced frontend developer with a passion for creating intuitive user interfaces. Proven track record of leading teams and delivering high-quality products.",
		top_strength: {
			title: "Strong React & TypeScript expertise",
			description: "6 years of hands-on experience with modern frontend stack",
			evidence: "Led Next.js migration reducing load time by 40%",
			job_relevance: "Directly matches core technical requirements",
			ai_opinion:
				"Candidate demonstrates both depth and breadth in the required stack",
		},
		top_concern: {
			title: "Limited backend exposure",
			description: "Experience is primarily frontend-focused",
			evidence: "No evidence of backend service ownership",
			job_relevance: "Role requires occasional backend contributions",
			ai_opinion: "Manageable gap given strong frontend foundation",
		},
		strengths: [
			{
				title: "Proficient in TypeScript, React, Next.js, and Next.js.",
				description: "Expert-level React, TypeScript and Next.js",
				evidence: "Led CRA → Next.js migration with measurable results",
				job_relevance: "Core stack matches role requirements",
				ai_opinion: "Top-tier skill match",
				impact: "HIGH",
			},
			{
				title: "Solid experience with CI/CD and Docker.",
				description:
					"Consistently delivered measurable load and bundle improvements",
				evidence: "40% load time reduction, 30% bundle size reduction",
				job_relevance: "Performance is a key success metric for this role",
				ai_opinion: "Strong demonstrated impact",
				impact: "HIGH",
			},
			{
				title:
					"Strong background in developing scalable and secure applications.",
				description: "Mentored junior engineers and led cross-team initiatives",
				evidence: "Mentored 3 junior engineers at TechCorp",
				job_relevance: "Senior role requires leadership qualities",
				ai_opinion: "Positive signal for senior-level fit",
				impact: "MEDIUM",
			},
		],
		gaps: [
			{
				title: "No specific certifications mentioned.",
				description: "No evidence of backend service ownership",
				job_relevance: "Role requires occasional Node.js contributions",
				why_gap: "Career has been entirely frontend-focused",
				ai_opinion: "Manageable given role is primarily frontend",
				impact: "MINOR",
			},
		],
		red_flags: [],
		matched_technical_skills: [
			"React",
			"TypeScript",
			"Next.js",
			"GraphQL",
			"Tailwind CSS",
		],
		missing_technical_skills: ["AWS Lambda", "Docker"],
		matched_soft_skills: ["Leadership", "Communication", "Mentoring"],
		missing_soft_skills: [],
		matched_skills: [
			"React",
			"TypeScript",
			"Next.js",
			"GraphQL",
			"Tailwind CSS",
		],
		missing_skills: ["AWS Lambda", "Docker"],
		strengths_count: 3,
		gaps_count: 1,
		matched_count: 5,
		missing_count: 2,
		review: {
			description:
				"Sarah is a strong match for this role with 6 years of relevant experience.",
			dealbreakers: [],
		},
		skill_depth: [
			{ skill: "React", depth: "expert", required_by_job: true },
			{ skill: "TypeScript", depth: "expert", required_by_job: true },
			{ skill: "Next.js", depth: "proficient", required_by_job: true },
			{ skill: "GraphQL", depth: "proficient", required_by_job: false },
			{ skill: "Docker", depth: "missing", required_by_job: true },
		],
	},
	application: { documents: [] },
};

// ─── Design config ─────────────────────────────────────────────────────────────

const SKILL_PILL_COLORS = [
	"bg-blue-100 text-blue-700",
	"bg-violet-100 text-violet-700",
	"bg-teal-100 text-teal-700",
	"bg-green-100 text-green-700",
	"bg-amber-100 text-amber-700",
	"bg-rose-100 text-rose-700",
	"bg-indigo-100 text-indigo-700",
	"bg-cyan-100 text-cyan-700",
];

const APPLICATION_STATUS_CONFIG: Record<
	string,
	{ label: string; className: string }
> = {
	active: { label: "Active", className: "bg-emerald-500 text-white" },
	in_review: { label: "In Review", className: "bg-blue-500 text-white" },
	shortlisted: { label: "Shortlist", className: "bg-teal-500 text-white" },
	in_interview: { label: "In Interview", className: "bg-amber-400 text-white" },
	offer: { label: "Offer", className: "bg-orange-400 text-white" },
	rejected: { label: "Rejected", className: "bg-rose-500 text-white" },
};

const STATUS_STEP_MAP: Record<string, number> = {
	active: 1,
	in_review: 2,
	shortlisted: 3,
	in_interview: 4,
	offer: 5,
	rejected: 2,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
	if (!date) return null;
	const parsed = new Date(date);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

function recommendationLabel(rec?: string | null): string {
	switch ((rec ?? "").toLowerCase()) {
		case "highly_recommended":
			return "High Recommend";
		case "recommended":
			return "Recommended";
		case "consider":
			return "Consider";
		case "not_recommended":
			return "Not Recommend";
		default:
			return "Pending";
	}
}

function buildTimeline(
	status: string,
	appliedDate: string | null,
	reviewDate: string | null
) {
	const currentStep = STATUS_STEP_MAP[status] ?? 1;
	const steps = [
		{ label: "Application Received", date: appliedDate },
		{ label: "Resume Reviewed", date: reviewDate },
		{ label: "Phone Screen Scheduled", date: null },
		{ label: "Technical Interview", date: null },
		{ label: "Final Interview", date: null },
	];
	return steps.map((step, i) => ({
		...step,
		done: i + 1 < currentStep,
		active: i + 1 === currentStep,
	}));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonBlock = ({ className }: { className: string }) => (
	<div
		className={`rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`}
	/>
);

const SingleProfileLoadingSkeleton = () => (
	<div className="w-full space-y-5">
		<SectionCard className="p-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<SkeletonBlock className="h-14 w-14 rounded-full" />
					<div className="space-y-2">
						<SkeletonBlock className="h-5 w-44" />
						<SkeletonBlock className="h-4 w-32" />
						<SkeletonBlock className="h-3 w-64" />
					</div>
				</div>
				<div className="flex gap-3">
					<SkeletonBlock className="h-10 w-16 rounded-xl" />
					<SkeletonBlock className="h-10 w-36 rounded-xl" />
				</div>
			</div>
		</SectionCard>
		<div className="grid grid-cols-3 gap-5">
			<div className="col-span-2 space-y-4">
				<div className="grid grid-cols-3 gap-3">
					<SkeletonBlock className="h-24 rounded-2xl" />
					<SkeletonBlock className="h-24 rounded-2xl" />
					<SkeletonBlock className="h-24 rounded-2xl" />
				</div>
				<SkeletonBlock className="h-28 rounded-2xl" />
				<SkeletonBlock className="h-20 rounded-2xl" />
				<SkeletonBlock className="h-24 rounded-2xl" />
			</div>
			<div className="space-y-4">
				<SkeletonBlock className="h-20 rounded-2xl" />
				<SkeletonBlock className="h-52 rounded-2xl" />
			</div>
		</div>
	</div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ResumeDetailsClient = ({ resumeId }: { resumeId: number | string }) => {
	const { resume, loading, getResume } = useResumeDetailsStore();

	useEffect(() => {
		getResume(resumeId);
	}, [getResume, resumeId]);

	if (loading) {
		return <SingleProfileLoadingSkeleton />;
	}

	const displayResume = resume ?? MOCK_RESUME;
	const structured = displayResume.resume_structured?.data ?? null;
	const analysis = displayResume.resume_analysis;
	const review = analysis?.review ?? null;

	const score = analysis?.score ?? 0;
	const strengths = safeArray<ResumeAnalysisStrength>(analysis?.strengths);
	const gaps = safeArray<ResumeAnalysisGap>(analysis?.gaps);

	const contactEmail =
		structured?.contact?.email ??
		displayResume.resume_structured?.email ??
		null;
	const contactPhone =
		structured?.contact?.phone ??
		displayResume.resume_structured?.phone ??
		null;
	const profileTagline =
		analysis?.profile_tagline ??
		review?.description ??
		analysis?.summary ??
		null;
	const summaryParagraph = analysis?.analysis_summary_paragraph ?? null;

	const appliedDate = renderDate(displayResume.created_at);
	const reviewDate = renderDate((analysis as any)?.created_at ?? null);

	const appStatus = displayResume.application_status ?? "active";
	const statusCfg =
		APPLICATION_STATUS_CONFIG[appStatus] ?? APPLICATION_STATUS_CONFIG.active;

	return (
		<div className="w-full space-y-5">
			{/* Header */}
			<Link
				href="/candidates"
				className="inline-flex items-center gap-2 rounded-xl border border-resume-border bg-resume-surface-soft px-3 py-2 text-sm font-semibold text-resume-text-muted transition-colors hover:bg-resume-surface hover:text-resume-text-strong"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Candidates
			</Link>
			<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
				<div className="flex items-center gap-4">
					<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#005CA9] text-[16px] font-bold text-white">
						{getInitials(structured?.name ?? displayResume.name)}
					</div>
					<div>
						<h1 className="text-[18px] font-bold text-slate-900 dark:text-slate-100">
							{structured?.name ?? displayResume.name}
						</h1>
						<p className="text-sm font-medium text-[#005CA9]">
							{structured?.current_title ??
								displayResume.resume_structured?.current_title ??
								displayResume.job?.title ??
								"—"}
						</p>
						<div className="mt-1.5 flex flex-wrap items-center gap-4 text-[12px] text-slate-500 dark:text-slate-400">
							{contactEmail && (
								<span className="flex items-center gap-1.5">
									<Mail className="h-3.5 w-3.5 shrink-0" />
									{contactEmail}
								</span>
							)}
							{contactPhone && (
								<span className="flex items-center gap-1.5">
									<Phone className="h-3.5 w-3.5 shrink-0" />
									{contactPhone}
								</span>
							)}
							{(structured?.location?.city ||
								structured?.location?.country) && (
								<span className="flex items-center gap-1.5">
									<MapPin className="h-3.5 w-3.5 shrink-0" />
									{[structured?.location?.city, structured?.location?.country]
										.filter(Boolean)
										.join(", ")}
								</span>
							)}
							{appliedDate && (
								<span className="flex items-center gap-1.5">
									<CalendarDays className="h-3.5 w-3.5 shrink-0" />
									Applied {appliedDate}
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-3">
					<div className="rounded-xl bg-emerald-500 px-4 py-2 text-center">
						<span className="text-[22px] font-black text-white">{score}</span>
						<span className="text-[11px] text-white/80"> /100</span>
					</div>
					{displayResume.link && displayResume.link !== "#" && (
						<a
							href={displayResume.link}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
						>
							<ArrowDownToLine className="h-4 w-4" />
							Download Resume
						</a>
					)}
				</div>
			</div>

			{/* Body */}
			<div className="grid grid-cols-3 gap-5">
				{/* Left column */}
				<div className="col-span-2 space-y-4">
					{/* Analysis */}
					<div>
						<h2 className="mb-3 text-[15px] font-bold text-slate-700 dark:text-slate-200">
							Analysis
						</h2>
						<div className="grid grid-cols-3 gap-3">
							<div className="rounded-2xl bg-[#005CA9] px-6 py-6 space-y-4">
								<div className="flex items-start gap-x-3">
									<span className="w-10 h-10 rounded-md bg-white grid place-items-center">
										<Users className="text-[#005CA9] w-5 h-5" />
									</span>
									<p className="text-sm font-medium uppercase tracking-wider text-white">
										Seniority Level
									</p>
								</div>
								<p className="mt-2 text-xl font-black text-white">
									{analysis?.seniority_level ?? "—"}
								</p>
							</div>
							<div className="rounded-2xl bg-[#905DF8] px-6 py-6 space-y-4">
								<div className="flex items-start gap-x-3">
									<span className="w-10 h-10 rounded-md bg-white grid place-items-center">
										<Briefcase className="text-[#905DF8] w-5 h-5" />
									</span>
									<p className="text-sm font-medium uppercase tracking-wider text-white">
										Recommendation
									</p>
								</div>
								<p className="mt-2 text-xl font-black text-white">
									{recommendationLabel(analysis?.recommendation)}
								</p>
							</div>
							<div className="rounded-2xl bg-[#48BB78] px-6 py-6 space-y-4">
								<div className="flex items-start gap-x-3">
									<span className="w-10 h-10 rounded-md bg-white grid place-items-center">
										<ScrollText className="text-[#48BB78] w-5 h-5" />
									</span>
									<p className="text-sm font-medium uppercase tracking-wider text-white">
										Score
									</p>
								</div>
								<p className="mt-2 text-xl font-black text-white">
									{score}{" "}
									<span className="text-sm font-normal text-white/80">
										/ 100
									</span>
								</p>
							</div>
						</div>
					</div>

					{/* Strengths */}
					{strengths.length > 0 && (
						<div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
							<h3 className="mb-3 font-bold text-emerald-700 dark:text-emerald-400">
								Strengths
							</h3>
							<ul className="space-y-2">
								{strengths.map((s: any, i: number) => (
									<li
										key={i}
										className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
									>
										<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
										{typeof s === "string" ? s : s.title}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Weaknesses */}
					{gaps.length > 0 && (
						<div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 dark:border-rose-900/30 dark:bg-rose-950/20">
							<h3 className="mb-3 font-bold text-rose-600 dark:text-rose-400">
								Weaknesses
							</h3>
							<ul className="space-y-2">
								{gaps.map((g: any, i: number) => (
									<li
										key={i}
										className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
									>
										<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
										{typeof g === "string" ? g : g.title}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Summary */}
					{profileTagline && (
						<div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
							<h3 className="mb-2 font-bold text-slate-700 dark:text-slate-200">
								Summary
							</h3>
							<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
								{profileTagline}
							</p>
						</div>
					)}

					{summaryParagraph && summaryParagraph !== profileTagline && (
						<div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
							<h3 className="mb-2 font-bold text-slate-700 dark:text-slate-200">
								Summary
							</h3>
							<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
								{summaryParagraph}
							</p>
						</div>
					)}

					{/* Experience & Education */}
					<div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
						<h3 className="mb-4 font-bold text-slate-700 dark:text-slate-200">
							Experience & Education
						</h3>
						<div className="space-y-3">
							{(structured?.total_experience_years ??
								displayResume.resume_structured?.total_experience_years) !=
								null && (
								<div>
									<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
										Experience
									</p>
									<p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
										{structured?.total_experience_years ??
											displayResume.resume_structured
												?.total_experience_years}{" "}
										years
									</p>
								</div>
							)}
							{structured?.education && structured.education.length > 0 && (
								<div>
									<p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
										Education
									</p>
									{structured.education.map((edu, i) => (
										<p
											key={i}
											className="mt-0.5 text-sm text-slate-700 dark:text-slate-300"
										>
											{[edu.degree, edu.institution].filter(Boolean).join(", ")}
										</p>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Skills */}
					{(structured?.skills ?? []).length > 0 && (
						<div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
							<h3 className="mb-3 font-bold text-slate-700 dark:text-slate-200">
								Skills
							</h3>
							<div className="flex flex-wrap gap-2">
								{structured!.skills!.map((skill, i) => (
									<span
										key={`${skill}-${i}`}
										className={clsx(
											"rounded-full px-3 py-1 text-xs font-semibold",
											SKILL_PILL_COLORS[i % SKILL_PILL_COLORS.length]
										)}
									>
										{skill}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Right column */}
				<div className="space-y-4">
					{/* Status */}
					<div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
						<h3 className="mb-3 font-bold text-slate-700 dark:text-slate-200">
							Status
						</h3>
						<span
							className={clsx(
								"inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold",
								statusCfg.className
							)}
						>
							{statusCfg.label}
						</span>
					</div>

					{/* Timeline */}
					<div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
						<h3 className="mb-4 font-bold text-slate-700 dark:text-slate-200">
							Timeline
						</h3>
						<div>
							{buildTimeline(appStatus, appliedDate, reviewDate).map(
								(step, i, arr) => (
									<div key={step.label} className="flex gap-3">
										<div className="flex flex-col items-center">
											<div
												className={clsx(
													"mt-0.5 h-3 w-3 shrink-0 rounded-full",
													step.done
														? "bg-emerald-500"
														: step.active
															? "bg-[#005CA9]"
															: "bg-slate-200 dark:bg-slate-700"
												)}
											/>
											{i < arr.length - 1 && (
												<div className="min-h-[28px] w-px flex-1 bg-slate-100 dark:bg-slate-800" />
											)}
										</div>
										<div className="pb-4">
											<p
												className={clsx(
													"text-[13px] font-semibold",
													step.done || step.active
														? "text-slate-800 dark:text-slate-100"
														: "text-slate-400 dark:text-slate-500"
												)}
											>
												{step.label}
											</p>
											<p className="mt-0.5 text-[11px] text-slate-400">
												{step.date ?? "TBD"}
											</p>
										</div>
									</div>
								)
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ResumeDetailsClient;
