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
	FileText,
	Plus,
} from "lucide-react";
import useDashboardStore from "@/shared/store/pages/dashboard/useDashboardStore";
import { DashboardActivity } from "@/shared/store/pages/dashboard/useDashboardStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

function formatPercent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

function formatTrend(trend: number): string {
	const abs = Math.abs(trend);
	return `${abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1)}%`;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
	Active: "#1e3a8a",
	Completed: "#16a34a",
	Review: "#7c3aed",
	Cancelled: "#ef4444",
	Postponed: "#f59e0b",
	Ended: "#94a3b8",
};
const FALLBACK_COLORS = [
	"#3b82f6",
	"#7c3aed",
	"#f59e0b",
	"#16a34a",
	"#ef4444",
	"#06b6d4",
];
function getStatusColor(stage: string, index: number): string {
	return (
		STATUS_COLORS[stage] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
	);
}

const DEPT_COLORS = [
	"#1e40af",
	"#7c3aed",
	"#16a34a",
	"#dc2626",
	"#d97706",
	"#0891b2",
];

// ─── Activity icon ─────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: DashboardActivity["type"] }) {
	const base = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full";
	switch (type) {
		case "interview":
			return (
				<span className={`${base} bg-blue-100`}>
					<CalendarCheck size={15} className="text-blue-600" />
				</span>
			);
		case "job":
			return (
				<span className={`${base} bg-purple-100`}>
					<Briefcase size={15} className="text-purple-600" />
				</span>
			);
		case "offer":
			return (
				<span className={`${base} bg-green-100`}>
					<CheckCircle2 size={15} className="text-green-600" />
				</span>
			);
		case "message":
			return (
				<span className={`${base} bg-orange-100`}>
					<MessageSquare size={15} className="text-orange-500" />
				</span>
			);
		default:
			return (
				<span className={`${base} bg-slate-100`}>
					<FileText size={15} className="text-slate-500" />
				</span>
			);
	}
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
	return (
		<div className="space-y-5 animate-pulse">
			{/* Metric cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="rounded-xl border border-slate-200 bg-white p-5"
					>
						<div className="h-10 w-10 rounded-lg bg-slate-200 mb-4" />
						<div className="h-3 w-20 rounded bg-slate-200 mb-2" />
						<div className="h-7 w-14 rounded bg-slate-200 mb-3" />
						<div className="h-3 w-16 rounded bg-slate-200" />
					</div>
				))}
			</div>
			{/* Overview */}
			<div className="rounded-xl border border-slate-200 bg-white p-5">
				<div className="h-4 w-40 rounded bg-slate-200 mb-5" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i}>
							<div className="h-3 w-28 rounded bg-slate-200 mb-2" />
							<div className="h-7 w-20 rounded bg-slate-200" />
						</div>
					))}
				</div>
			</div>
			{/* Charts */}
			<div className="grid gap-4 lg:grid-cols-5">
				<div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5">
					<div className="h-4 w-32 rounded bg-slate-200 mb-1" />
					<div className="h-3 w-48 rounded bg-slate-200 mb-4" />
					<div className="h-56 rounded-lg bg-slate-100" />
				</div>
				<div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
					<div className="h-4 w-32 rounded bg-slate-200 mb-1" />
					<div className="h-3 w-40 rounded bg-slate-200 mb-4" />
					<div className="h-56 rounded-lg bg-slate-100" />
				</div>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				{Array.from({ length: 2 }).map((_, i) => (
					<div
						key={i}
						className="rounded-xl border border-slate-200 bg-white p-5"
					>
						<div className="h-4 w-44 rounded bg-slate-200 mb-1" />
						<div className="h-3 w-28 rounded bg-slate-200 mb-4" />
						<div className="h-56 rounded-lg bg-slate-100" />
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Trend Chip ───────────────────────────────────────────────────────────────

function TrendChip({
	trend,
	size = "sm",
}: {
	trend: number;
	size?: "sm" | "xs";
}) {
	if (trend === 0) return <span className="text-xs text-slate-400">—</span>;
	const up = trend > 0;
	const textSize = size === "xs" ? "text-[11px]" : "text-xs";
	return (
		<span
			className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${textSize} ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
		>
			<ArrowUpRight size={10} className={up ? "" : "rotate-90"} />
			{up ? "+" : "-"}
			{formatTrend(trend)}
		</span>
	);
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
	children,
	className = "",
	href,
}: {
	children: React.ReactNode;
	className?: string;
	href?: string;
}) {
	return href ? (
		<Link
			href={href}
			className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
		>
			{children}
		</Link>
	) : (
		<div
			className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
		>
			{children}
		</div>
	);
}

// ─── Custom tooltip ────────────────────────────────────────────────────────────

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
		<div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md text-xs">
			<p className="mb-1 font-semibold text-slate-500">{label}</p>
			{payload.map((p) => (
				<p key={p.name} style={{ color: p.color }} className="font-bold">
					{p.name}: {p.value}
				</p>
			))}
		</div>
	);
}

// ─── Donut legend ─────────────────────────────────────────────────────────────

function DonutLegend({
	data,
	total,
}: {
	data: { stage: string; value: number }[];
	total: number;
}) {
	return (
		<div className="flex flex-col gap-2.5 justify-center min-w-0">
			{data.map((item, i) => (
				<div
					key={item.stage}
					className="flex items-center justify-between gap-3"
				>
					<div className="flex items-center gap-1.5 min-w-0">
						<span
							className="h-2.5 w-2.5 shrink-0 rounded-full"
							style={{ backgroundColor: getStatusColor(item.stage, i) }}
						/>
						<span className="text-xs text-slate-600 truncate">
							{item.stage}
						</span>
					</div>
					<span className="text-xs font-bold text-slate-700 shrink-0">
						{total > 0 ? `${Math.round((item.value / total) * 100)}%` : "0%"}
					</span>
				</div>
			))}
		</div>
	);
}

// ─── Metric card configs ───────────────────────────────────────────────────────

const METRIC_CONFIGS = [
	{
		key: "activeJobs" as const,
		label: "Active Jobs",
		Icon: Briefcase,
		iconBg: "bg-[#005ca9]",
		href: "/jobs",
	},
	{
		key: "totalCandidates" as const,
		label: "Candidates",
		Icon: Users,
		iconBg: "bg-purple-500",
		href: "/candidates",
	},
	{
		key: "upcomingInterviews" as const,
		label: "Interviews",
		Icon: CalendarCheck,
		iconBg: "bg-orange-400",
		href: "/interviews",
	},
	{
		key: "unreadMessages" as const,
		label: "Messages",
		Icon: MessageSquare,
		iconBg: "bg-green-500",
		href: "/inbox",
	},
];

// ─── Main Component ────────────────────────────────────────────────────────────

const DashboardPage = () => {
	const {
		adminDashboard: dashboard,
		loading,
		getAdminDashboard,
	} = useDashboardStore();

	useEffect(() => {
		getAdminDashboard();
	}, [getAdminDashboard]);

	const statusTotal = useMemo(
		() => (dashboard?.applicationStatus ?? []).reduce((s, a) => s + a.value, 0),
		[dashboard?.applicationStatus]
	);

	if (loading || !dashboard) return <DashboardSkeleton />;

	const {
		metrics,
		overview,
		weeklyActivity,
		applicationStatus,
		departmentProgress,
		monthlyGrowth,
		recentActivities,
	} = dashboard;

	const deptRows =
		departmentProgress.length > 0
			? departmentProgress
			: [
					{ department: "Engineering", currentHired: 0, targetHires: 0 },
					{ department: "Sales", currentHired: 0, targetHires: 0 },
					{ department: "Marketing", currentHired: 0, targetHires: 0 },
					{ department: "Design", currentHired: 0, targetHires: 0 },
				];

	return (
		<div className="space-y-5">
			{/* ── Page header ─────────────────────────────────────────────────── */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
					<p className="text-sm text-slate-400 mt-0.5">
						{`Welcome back! Here's what's happening today.`}
					</p>
				</div>
				{/* <Button
					asChild
					className="rounded-lg bg-[#005ca9] text-sm font-semibold text-white hover:bg-[#004e8f] h-9 px-4 shadow-sm"
				>
					<Link href="/jobs/new" className="flex items-center gap-1.5">
						<Plus className="h-4 w-4 stroke-[2.5]" />
						Post New Job
					</Link>
				</Button> */}
			</div>

			{/* ── Metric cards ────────────────────────────────────────────────── */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{METRIC_CONFIGS.map(({ key, label, Icon, iconBg, href }) => (
					<Card key={key} href={href}>
						<div
							className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
						>
							<Icon size={18} className="text-white" />
						</div>
						<p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
							{label}
						</p>
						<p className="mt-1 text-[28px] font-bold leading-none text-slate-900">
							{metrics[key].value.toLocaleString()}
						</p>
						<div className="mt-2 flex items-center gap-1.5">
							<TrendChip trend={metrics[key].trend} size="xs" />
							<span className="text-[11px] text-slate-400">vs last week</span>
						</div>
					</Card>
				))}
			</div>

			{/* ── Overview Statistics ─────────────────────────────────────────── */}
			<Card>
				<h2 className="text-sm font-semibold text-slate-900 mb-4">
					Overview Statistics
				</h2>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
					{/* Enquiries */}
					<div className="pl-0 pr-4">
						<p className="text-xs text-slate-500 mb-1">Enquiries</p>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold text-slate-900">
								{overview.enquiries.value.toLocaleString()}
							</span>
							<TrendChip trend={overview.enquiries.trend} />
						</div>
					</div>
					{/* New Applicants */}
					<div className="pl-4 pr-4">
						<p className="text-xs text-slate-500 mb-1">New Applicants</p>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold text-slate-900">
								{overview.newApplicants.value.toLocaleString()}
							</span>
							<TrendChip trend={overview.newApplicants.trend} />
						</div>
					</div>
					{/* Interviews Scheduled */}
					<div className="pl-4 pr-4">
						<p className="text-xs text-slate-500 mb-1">Interviews Scheduled</p>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold text-slate-900">
								{overview.interviewsScheduled.value.toLocaleString()}
							</span>
							<TrendChip trend={overview.interviewsScheduled.trend} />
						</div>
					</div>
					{/* Hiring Success Rate */}
					<div className="pl-4">
						<p className="text-xs text-slate-500 mb-1">Hiring Success Rate</p>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold text-slate-900">
								{formatPercent(overview.hiringSuccessRate.value)}
							</span>
							<TrendChip trend={overview.hiringSuccessRate.trend} />
						</div>
					</div>
				</div>
			</Card>

			{/* ── Weekly Activity + Application Status ────────────────────────── */}
			<div className="grid gap-4 lg:grid-cols-5">
				{/* Weekly Activity */}
				<Card className="lg:col-span-3">
					<h2 className="text-sm font-semibold text-slate-900">
						Weekly Activity
					</h2>
					<p className="text-xs text-slate-400 mt-0.5">
						Applications &amp; Interviews this week
					</p>
					<div className="mt-4 h-[220px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={weeklyActivity}
								margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
							>
								<defs>
									<linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="gInts" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#f1f5f9"
									vertical={false}
								/>
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
									iconSize={7}
									wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
									formatter={(v) => <span className="text-slate-500">{v}</span>}
								/>
								<Area
									type="monotone"
									dataKey="applications"
									name="applications"
									stroke="#3b82f6"
									strokeWidth={2}
									fill="url(#gApps)"
									dot={false}
								/>
								<Area
									type="monotone"
									dataKey="interviews"
									name="visits"
									stroke="#f59e0b"
									strokeWidth={2}
									fill="url(#gInts)"
									dot={false}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</Card>

				{/* Application Status */}
				<Card className="lg:col-span-2">
					<h2 className="text-sm font-semibold text-slate-900">
						Application Status
					</h2>
					<p className="text-xs text-slate-400 mt-0.5">
						Current distribution by stage
					</p>
					{applicationStatus.length === 0 ? (
						<div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
							No data
						</div>
					) : (
						<div className="mt-3 flex items-center gap-3">
							<div className="h-[180px] w-[180px] shrink-0">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={applicationStatus}
											dataKey="value"
											nameKey="stage"
											cx="50%"
											cy="50%"
											innerRadius={50}
											outerRadius={78}
											paddingAngle={2}
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

			{/* ── Department Progress + Monthly Growth ────────────────────────── */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Department Hiring Progress */}
				<Card className="flex flex-col">
					<h2 className="text-sm font-semibold text-slate-900">
						Department Hiring Progress
					</h2>
					<p className="text-xs text-slate-400 mt-0.5 mb-4">
						Progress to target
					</p>
					<div className="flex-1 space-y-4 overflow-y-auto max-h-70 pr-1">
						{deptRows.map(({ department, currentHired, targetHires }, i) => {
							const pct =
								targetHires > 0
									? Math.min(
											100,
											Math.round((currentHired / targetHires) * 100)
										)
									: 0;
							return (
								<div key={department}>
									<div className="flex items-center justify-between mb-1.5">
										<span className="text-sm font-medium text-slate-700">
											{department}
										</span>
										<span className="text-xs text-slate-400">
											{currentHired}/{targetHires}&nbsp;
											<span className="font-semibold text-slate-600">
												{pct}%
											</span>
										</span>
									</div>
									<div className="h-2 w-full rounded-full bg-slate-100">
										<div
											className="h-2 rounded-full transition-all duration-700"
											style={{
												width: `${pct}%`,
												backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length],
											}}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</Card>

				{/* Monthly Growth */}
				<Card>
					<h2 className="text-sm font-semibold text-slate-900">
						Monthly Growth
					</h2>
					<p className="text-xs text-slate-400 mt-0.5">
						Application volume trend
					</p>
					<div className="mt-3 h-[190px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={monthlyGrowth.chartData}
								margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
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
									radius={[3, 3, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-3 border-t border-slate-100 pt-3 flex items-baseline justify-between">
						<p className="text-xs text-slate-400">Total this month</p>
						<div className="flex items-baseline gap-1.5">
							<span className="text-xl font-bold text-slate-900">
								{monthlyGrowth.currentMonth.total.toLocaleString()}
							</span>
							{monthlyGrowth.currentMonth.trend !== 0 && (
								<span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
									<TrendingUp size={11} />+
									{monthlyGrowth.currentMonth.trend.toFixed(1)}%
								</span>
							)}
						</div>
					</div>
				</Card>
			</div>

			{/* ── Recent Activity ──────────────────────────────────────────────── */}
			<Card>
				<div className="mb-4">
					<h2 className="text-sm font-semibold text-slate-900">
						Recent Activity
					</h2>
					<p className="text-xs text-emerald-500 font-medium mt-0.5">
						+{recentActivities.length} this week
					</p>
				</div>
				{recentActivities.length === 0 ? (
					<p className="text-sm text-slate-400 text-center py-8">
						No recent activity
					</p>
				) : (
					<div className="divide-y divide-slate-100">
						{recentActivities.map((activity, i) => (
							<div
								key={`${activity.id}-${i}`}
								className="flex items-start gap-3 py-3"
							>
								<ActivityIcon type={activity.type} />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-slate-800 truncate">
										{activity.title}
									</p>
									{activity.description && (
										<p className="text-xs text-slate-400 truncate mt-0.5">
											{activity.description}
										</p>
									)}
								</div>
								<div className="shrink-0 flex items-center gap-1 text-[11px] text-slate-400">
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
