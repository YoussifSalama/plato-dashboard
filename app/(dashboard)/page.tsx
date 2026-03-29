"use client";

import { useEffect, useMemo } from "react";
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	CartesianGrid,
	Legend,
} from "recharts";
import {
	Briefcase,
	Users,
	CalendarCheck,
	MessageSquare,
	TrendingUp,
	ArrowUpRight,
	Clock,
	CheckCircle2,
	XCircle,
	FileText,
	Plus,
} from "lucide-react";
import useDashboardStore from "@/shared/store/pages/dashboard/useDashboardStore";
import { DashboardActivity } from "@/shared/store/pages/dashboard/useDashboardStore";
import { useInterviewStatisticsStore } from "@/shared/store/pages/interview/useInterviewStatisticsStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { motion } from "framer-motion";

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(timestamp: string): string {
	const diff = Date.now() - new Date(timestamp).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
	const days = Math.floor(hours / 24);
	return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function formatTrend(trend: number): string {
	if (trend === 0) return "0%";
	return `+${trend.toFixed(trend % 1 === 0 ? 0 : 1)}%`;
}

function formatPercent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

// ─── Progress Bar helpers ───────────────────────────────────────────────────

const ProgressBar = ({
	current,
	max,
	label,
	extraQuota = 0,
}: {
	current: number;
	max: number | null;
	label: string;
	extraQuota?: number;
}) => {
	const effectiveMax = max !== null ? max + extraQuota : null;
	const isUnlimited = effectiveMax === null;
	const percentage = isUnlimited
		? 0
		: Math.min(100, Math.max(0, (current / effectiveMax!) * 100));

	let colorClass = "bg-blue-600 dark:bg-blue-500";
	if (!isUnlimited) {
		if (percentage >= 100) colorClass = "bg-red-600 dark:bg-red-500";
		else if (percentage >= 80) colorClass = "bg-amber-500 dark:bg-amber-400";
	}

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm font-medium">
				<span className="text-slate-700 dark:text-slate-300">{label}</span>
				<div className="flex items-center gap-1.5">
					<span className="text-slate-500 dark:text-slate-400">
						{current} / {isUnlimited ? "Unlimited" : effectiveMax}
					</span>
					{extraQuota > 0 && (
						<span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
							+{extraQuota}
						</span>
					)}
				</div>
			</div>
			<div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
				<div
					className={clsx(
						"h-full transition-all duration-500 ease-out",
						colorClass
					)}
					style={{ width: isUnlimited ? "100%" : `${percentage}%` }}
				/>
			</div>
			{!isUnlimited && percentage >= 100 && (
				<p className="text-xs text-red-600 dark:text-red-400 mt-1">
					Quota exceeded.{" "}
					{label === "Completed Interviews"
						? "Candidates are blocked from starting new interviews."
						: "Upgrade your plan to continue."}
				</p>
			)}
			{!isUnlimited && percentage >= 80 && percentage < 100 && (
				<p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
					Approaching limit.
				</p>
			)}
		</div>
	);
};

// ─── Donut colours ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
	New: "#1e3a8a",
	Review: "#7c3aed",
	Interview: "#d97706",
	Offer: "#16a34a",
	Rejected: "#dc2626",
	Cancelled: "#ef4444",
	Postponed: "#f59e0b",
	Completed: "#22c55e",
	Active: "#3b82f6",
	Pending: "#a855f7",
};

const FALLBACK_COLORS = [
	"#3b82f6",
	"#7c3aed",
	"#f59e0b",
	"#16a34a",
	"#ef4444",
	"#06b6d4",
	"#f97316",
];

function getStatusColor(stage: string, index: number): string {
	return (
		STATUS_COLORS[stage] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
	);
}

// ─── Activity type icon ──────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: DashboardActivity["type"] }) {
	const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full";
	switch (type) {
		case "interview":
			return (
				<span className={`${base} bg-blue-100 dark:bg-blue-900/40`}>
					<CalendarCheck
						size={14}
						className="text-blue-600 dark:text-blue-300"
					/>
				</span>
			);
		case "job":
			return (
				<span className={`${base} bg-purple-100 dark:bg-purple-900/40`}>
					<Briefcase
						size={14}
						className="text-purple-600 dark:text-purple-300"
					/>
				</span>
			);
		case "offer":
			return (
				<span className={`${base} bg-green-100 dark:bg-green-900/40`}>
					<CheckCircle2
						size={14}
						className="text-green-600 dark:text-green-300"
					/>
				</span>
			);
		case "message":
			return (
				<span className={`${base} bg-orange-100 dark:bg-orange-900/40`}>
					<MessageSquare
						size={14}
						className="text-orange-500 dark:text-orange-300"
					/>
				</span>
			);
		default:
			return (
				<span className={`${base} bg-slate-100 dark:bg-slate-800`}>
					<FileText size={14} className="text-slate-500" />
				</span>
			);
	}
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			{/* Metric cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="rounded-[10px] border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900"
					>
						<div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 mb-3" />
						<div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
						<div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-700" />
					</div>
				))}
			</div>
			{/* Overview */}
			<div className="rounded-[10px] border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
				<div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i}>
							<div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
							<div className="h-7 w-20 rounded bg-slate-200 dark:bg-slate-700" />
						</div>
					))}
				</div>
			</div>
			{/* Charts row */}
			<div className="grid gap-4 lg:grid-cols-5">
				<div className="lg:col-span-3 rounded-[10px] border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
					<div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
					<div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800" />
				</div>
				<div className="lg:col-span-2 rounded-[10px] border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
					<div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
					<div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800" />
				</div>
			</div>
			{/* Bottom row */}
			<div className="grid gap-4 lg:grid-cols-2">
				{Array.from({ length: 2 }).map((_, i) => (
					<div
						key={i}
						className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900"
					>
						<div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
						<div className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800" />
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Trend Badge ────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: number }) {
	if (trend === 0) return <span className="text-xs text-slate-400">—</span>;
	return (
		<span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
			<ArrowUpRight size={11} />
			{formatTrend(trend)}
		</span>
	);
}

// ─── Card wrapper ────────────────────────────────────────────────────────────

function Card({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900 dark:shadow-none ${className}`}
		>
			{children}
		</div>
	);
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

const METRIC_CONFIGS = [
	{
		key: "activeJobs" as const,
		label: "Active Jobs",
		Icon: Briefcase,
		iconBg: "bg-[#005ca9]",
		iconColor: "text-white",
	},
	{
		key: "totalCandidates" as const,
		label: "Candidates",
		Icon: Users,
		iconBg: "bg-purple-500",
		iconColor: "text-white",
	},
	{
		key: "upcomingInterviews" as const,
		label: "Total Interviews",
		Icon: CalendarCheck,
		iconBg: "bg-orange-400",
		iconColor: "text-white",
	},
	{
		key: "unreadMessages" as const,
		label: "Messages",
		Icon: MessageSquare,
		iconBg: "bg-green-500",
		iconColor: "text-white",
	},
];

// ─── Custom Donut Legend ──────────────────────────────────────────────────────

function DonutLegend({
	data,
	total,
}: {
	data: { stage: string; value: number }[];
	total: number;
}) {
	return (
		<div className="flex flex-col gap-2 justify-center">
			{data.map((item, i) => (
				<div
					key={item.stage}
					className="flex items-center justify-between gap-4"
				>
					<div className="flex items-center gap-2 min-w-0">
						<span
							className="h-3 w-3 shrink-0 rounded-full"
							style={{ backgroundColor: getStatusColor(item.stage, i) }}
						/>
						<span className="truncate text-sm text-slate-600 dark:text-slate-300">
							{item.stage}
						</span>
					</div>
					<span className="text-sm font-semibold text-slate-700 dark:text-slate-200 shrink-0">
						{total > 0 ? `${Math.round((item.value / total) * 100)}%` : "0%"}
					</span>
				</div>
			))}
		</div>
	);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{ name: string; value: number; color: string }>;
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
			<p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
			{payload.map((p) => (
				<p
					key={p.name}
					style={{ color: p.color }}
					className="text-xs font-bold"
				>
					{p.name}: {p.value}
				</p>
			))}
		</div>
	);
}

// ─── Main Component ──────────────────────────────────────────────────────────

const DashboardPage = () => {
	const { dashboard, loading, getDashboard } = useDashboardStore();
	const { statistics: interviewStats, getInterviewStatistics } =
		useInterviewStatisticsStore();
	// const { subscription, loadingSubscription, getSubscription } =
	// 	useSubscriptionStore();

	useEffect(() => {
		getDashboard();
	}, [getDashboard]);

	useEffect(() => {
		getInterviewStatistics();
	}, [getInterviewStatistics]);

	// useEffect(() => {
	// 	getSubscription();
	// }, [getSubscription]);

	const showSkeleton = true;

	// const currentPeriodEnd = subscription?.current_period_end
	// 	? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
	// 			month: "2-digit",
	// 			day: "2-digit",
	// 			year: "numeric",
	// 		})
	// 	: null;

	const currentPeriodEnd = "29-06-2026";

	// const statusTotal = useMemo(
	// 	() => (dashboard?.applicationStatus ?? []).reduce((s, a) => s + a.value, 0),
	// 	[dashboard?.applicationStatus]
	// );
	const statusTotal = 100;
	if (showSkeleton) {
		console.log("here");
		return <DashboardSkeleton />;
	}

	const {
		metrics,
		overview,
		weeklyActivity,
		applicationStatus,
		departmentProgress,
		monthlyGrowth,
		recentActivities,
	} = dashboard!;

	return (
		<div className="space-y-6">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
						Agency Dashboard
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{`Welcome back! Here's what's happening today.`}
					</p>
				</div>
				<Button
					asChild
					className="rounded-[10px] bg-[#005ca9] text-[14px] font-semibold text-white hover:bg-[#004e8f] h-10 px-4 transition-colors shadow-sm"
				>
					<Link href="/jobs/new" className="flex items-center gap-1.5">
						<Plus className="h-4 w-4 stroke-[2.5]" />
						Post New Job
					</Link>
				</Button>
			</div>

			{/* ── Metric Cards ── */}
			<div className="grid gap-4  sm:grid-cols-2 lg:grid-cols-4">
				{METRIC_CONFIGS.map(({ key, label, Icon, iconBg, iconColor }) => (
					<Card key={key}>
						<div
							className={`mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] ${iconBg}`}
						>
							<Icon size={20} className={iconColor} />
						</div>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{label}
						</p>
						<p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
							{key === "upcomingInterviews"
								? (interviewStats?.total_scheduled ?? 0).toLocaleString()
								: metrics[key].toLocaleString()}
						</p>
					</Card>
				))}
			</div>

			{/* ── Quota Usage Card ── */}
			<Card>
				<div className="flex flex-col sm:flex-row sm:items-center mb-6 justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-4 sm:gap-0">
					<div>
						<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
							Quota Usage
						</h2>
						{currentPeriodEnd && (
							<p className="text-xs text-slate-500 dark:text-slate-400">
								Your current cycle ends on:{" "}
								<span className="font-semibold text-slate-700 dark:text-slate-300">
									{currentPeriodEnd}
								</span>
							</p>
						)}
					</div>
					<motion.div
						whileHover={{ x: 5 }}
						transition={{ type: "spring", stiffness: 400, damping: 10 }}
					>
						<Link
							href="/billing#usage"
							className="group flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
						>
							View all
							<ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
						</Link>
					</motion.div>
				</div>
				<div className="grid gap-8 sm:grid-cols-3">
					<ProgressBar label="Job Postings" current={100} max={200} />
					<ProgressBar
						label="Completed Interviews"
						// current={subscription?.used_interview_sessions || 0}
						// max={subscription?.plan?.interview_sessions_quota ?? null}
						// extraQuota={subscription?.extra_interview_quota || 0}
						current={100}
						max={200}
						extraQuota={300}
					/>
					<ProgressBar
						label="Resume Analysis"
						// current={subscription?.used_resume_analysis || 0}
						// max={subscription?.plan?.resume_analysis_quota ?? null}
						// extraQuota={subscription?.extra_cv_scan_quota || 0}
						current={100}
						max={200}
						extraQuota={300}
					/>
				</div>
			</Card>

			{/* ── Overview Statistics ── */}
			<Card>
				<div className="flex items-center mb-4 justify-between">
					<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						Overview Statistics
					</h2>
				</div>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{/* Total Jobs */}
					<div>
						<p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
							Total Jobs
						</p>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
								{overview.totalJobs.value}
							</span>
							<TrendBadge trend={overview.totalJobs.trend} />
						</div>
					</div>
					{/* New Applicants */}
					<div>
						<p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
							New Applicants
						</p>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
								{overview.newApplicants.value.toLocaleString()}
							</span>
							<TrendBadge trend={overview.newApplicants.trend} />
						</div>
					</div>
					{/* Interviews Scheduled */}
					<div>
						<p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
							Interviews Scheduled
						</p>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
								{overview.interviewsScheduled.value.toLocaleString()}
							</span>
							<TrendBadge trend={overview.interviewsScheduled.trend} />
						</div>
					</div>
					{/* Hiring Success Rate */}
					<div>
						<p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
							Hiring Success Rate
						</p>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
								{formatPercent(overview.hiringSuccessRate.value)}
							</span>
							<TrendBadge trend={overview.hiringSuccessRate.trend} />
						</div>
					</div>
				</div>
			</Card>

			{/* ── Weekly Activity  +  Application Status ── */}
			<div className="grid gap-4 lg:grid-cols-5">
				{/* Weekly Activity chart */}
				<Card className="lg:col-span-3">
					<div className="mb-1">
						<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							Weekly Activity
						</h2>
						<p className="text-xs text-slate-400">
							Applications, Interviews &amp; Offers
						</p>
					</div>
					<div className="mt-4 h-60">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={weeklyActivity}
								margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
							>
								<defs>
									<linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
										<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="gradInts" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
										<stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
								<XAxis
									dataKey="day"
									tick={{ fontSize: 11, fill: "#94a3b8" }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 11, fill: "#94a3b8" }}
									axisLine={false}
									tickLine={false}
									allowDecimals={false}
								/>
								<Tooltip content={<ChartTooltip />} />
								<Legend
									iconType="circle"
									iconSize={8}
									wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
									formatter={(value) => (
										<span className="text-slate-500 dark:text-slate-400">
											{value}
										</span>
									)}
								/>
								<Area
									type="monotone"
									dataKey="applications"
									name="Applications"
									stroke="#3b82f6"
									strokeWidth={2}
									fill="url(#gradApps)"
									dot={false}
								/>
								<Area
									type="monotone"
									dataKey="interviews"
									name="Interviews"
									stroke="#f59e0b"
									strokeWidth={2}
									fill="url(#gradInts)"
									dot={false}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</Card>

				{/* Application Status donut */}
				<Card className="lg:col-span-2">
					<div className="mb-1">
						<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							Application Status
						</h2>
						<p className="text-xs text-slate-400">
							Current distribution by stage
						</p>
					</div>
					{applicationStatus.length === 0 ? (
						<div className="flex h-56 items-center justify-center text-sm text-slate-400">
							No data available
						</div>
					) : (
						<div className="mt-2 flex items-center gap-4">
							<div className="h-52 w-52 shrink-0">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={applicationStatus}
											dataKey="value"
											nameKey="stage"
											cx="50%"
											cy="50%"
											innerRadius={52}
											outerRadius={80}
											paddingAngle={3}
											strokeWidth={0}
										>
											{applicationStatus.map((entry, index) => (
												<Cell
													key={entry.stage}
													fill={getStatusColor(entry.stage, index)}
												/>
											))}
										</Pie>
										<Tooltip
											formatter={(value, name) => [
												`${value} (${statusTotal > 0 ? Math.round(((value as number) / statusTotal) * 100) : 0}%)`,
												name,
											]}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
							<DonutLegend data={applicationStatus} total={statusTotal} />
						</div>
					)}
				</Card>
			</div>

			{/* ── Department Hiring Progress  +  Monthly Growth ── */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Department progress */}
				<Card className="flex flex-col">
					<div className="mb-4">
						<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							Department Hiring Progress
						</h2>
						<p className="text-xs text-slate-400">Current vs Target</p>
					</div>
					<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[280px]">
						<div className="space-y-5">
							{(function () {
								const defaults = [
									{
										department: "Engineering",
										currentHired: 0,
										targetHires: 0,
									},
									{ department: "Sales", currentHired: 0, targetHires: 0 },
									{ department: "Marketing", currentHired: 0, targetHires: 0 },
									{ department: "Design", currentHired: 0, targetHires: 0 },
								];

								// Merge backend data over defaults
								const merged = [...defaults];
								departmentProgress.forEach((dp) => {
									const index = merged.findIndex(
										(d) =>
											d.department.toLowerCase() === dp.department.toLowerCase()
									);
									if (index !== -1) {
										merged[index] = dp;
									} else {
										merged.push(dp);
									}
								});

								return merged.map(
									({ department, currentHired, targetHires }, i) => {
										const pct =
											targetHires > 0
												? Math.min(
														100,
														Math.round((currentHired / targetHires) * 100)
													)
												: 0;
										const barColors = [
											"#1e40af",
											"#7c3aed",
											"#16a34a",
											"#dc2626",
											"#d97706",
										];
										const color = barColors[i % barColors.length];
										return (
											<div key={department}>
												<div className="flex items-center justify-between mb-1.5">
													<span className="text-sm font-medium text-slate-700 dark:text-slate-200">
														{department}
													</span>
													<span className="text-xs text-slate-400">
														{currentHired}/{targetHires} &nbsp;{" "}
														<span className="font-semibold text-slate-600 dark:text-slate-300">
															{pct}%
														</span>
													</span>
												</div>
												<div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
													<div
														className="h-2.5 rounded-full transition-all duration-700"
														style={{ width: `${pct}%`, backgroundColor: color }}
													/>
												</div>
											</div>
										);
									}
								);
							})()}
						</div>
					</div>
				</Card>

				{/* Monthly Growth bar chart */}
				<Card>
					<div className="mb-1">
						<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							Monthly Growth
						</h2>
						<p className="text-xs text-slate-400">Application volume trend</p>
					</div>
					<div className="mt-2 h-52">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={monthlyGrowth.chartData}
								margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#f1f5f9"
									vertical={false}
								/>
								<XAxis
									dataKey="month"
									tick={{ fontSize: 11, fill: "#94a3b8" }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 11, fill: "#94a3b8" }}
									axisLine={false}
									tickLine={false}
									allowDecimals={false}
								/>
								<Tooltip content={<ChartTooltip />} />
								<Bar
									dataKey="applications"
									name="Applications"
									fill="#2563eb"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
						<p className="text-xs uppercase tracking-wide text-slate-400">
							Current Month
						</p>
						<div className="flex items-baseline gap-2 mt-0.5">
							<span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
								{monthlyGrowth.currentMonth.total.toLocaleString()}
							</span>
							{monthlyGrowth.currentMonth.trend !== 0 && (
								<span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
									<TrendingUp size={12} />+
									{monthlyGrowth.currentMonth.trend.toFixed(1)}%
								</span>
							)}
						</div>
					</div>
				</Card>
			</div>

			{/* ── Recent Activity ── */}
			<Card>
				<div className="flex items-center justify-between mb-4">
					<div>
						<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							Recent Activity
						</h2>
						<p className="text-xs text-emerald-500 font-medium">
							+{recentActivities.length} this week
						</p>
					</div>
				</div>
				{recentActivities.length === 0 ? (
					<p className="text-sm text-slate-400 text-center py-8">
						No recent activity
					</p>
				) : (
					<div className="divide-y divide-slate-100 dark:divide-slate-800">
						{recentActivities.map((activity, i) => (
							<div
								key={`${activity.id}-${i}`}
								className="flex items-start gap-3 py-3"
							>
								<ActivityIcon type={activity.type} />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
										{activity.title}
									</p>
									{activity.description && (
										<p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
											{activity.description}
										</p>
									)}
								</div>
								<div className="shrink-0 flex items-center gap-1 text-xs text-slate-400">
									<Clock size={11} />
									{timeAgo(activity.timestamp)}
								</div>
							</div>
						))}
					</div>
				)}
			</Card>
		</div>
	);
};

export default DashboardPage;
