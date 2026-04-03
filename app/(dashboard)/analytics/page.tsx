"use client";

import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	BarChart,
	Bar,
	PieChart,
	Pie,
} from "recharts";
import clsx from "clsx";

// ─── Mock data ────────────────────────────────────────────────────────────────

const USER_GROWTH_DATA = [
	{ month: "Sep", companies: 120, candidates: 80 },
	{ month: "Oct", companies: 145, candidates: 110 },
	{ month: "Nov", companies: 180, candidates: 140 },
	{ month: "Dec", companies: 210, candidates: 165 },
	{ month: "Jan", companies: 260, candidates: 200 },
	{ month: "Feb", companies: 310, candidates: 245 },
];

const JOB_DISTRIBUTION = [
	{ name: "Engineering", value: 36, fill: "#1e3a5f" },
	{ name: "Design", value: 20, fill: "#7c3aed" },
	{ name: "Marketing", value: 18, fill: "#f97316" },
	{ name: "Sales", value: 15, fill: "#22c55e" },
	{ name: "Other", value: 11, fill: "#94a3b8" },
];

const HIRING_FUNNEL = [
	{ stage: "Applications", count: 2500 },
	{ stage: "Screening", count: 1900 },
	{ stage: "Interviews", count: 1200 },
	{ stage: "Offer", count: 680 },
	{ stage: "Hired", count: 420 },
];

const PERFORMANCE_METRICS = [
	{
		label: "Average Time to Hire",
		value: "23 days",
		sub: "3 days improvement",
		subColor: "#22c55e",
	},
	{
		label: "Application Response Rate",
		value: "68%",
		sub: "+5% increase",
		subColor: "#22c55e",
	},
	{
		label: "Interview Show Rate",
		value: "92%",
		sub: "+4% increase",
		subColor: "#22c55e",
	},
	{
		label: "Offer Acceptance Rate",
		value: "85%",
		sub: "2% decrease",
		subColor: "#ef4444",
	},
	{
		label: "Quality of Hire Score",
		value: "8.4/10",
		sub: "+0.3 improvement",
		subColor: "#22c55e",
	},
	{
		label: "Cost per Hire",
		value: "$2,450",
		sub: "$150 reduction",
		subColor: "#22c55e",
	},
];

// ─── Stat Card (colored) ──────────────────────────────────────────────────────

const KpiCard = ({
	label,
	value,
	sub,
	bg,
	icon,
}: {
	label: string;
	value: string;
	sub: string;
	bg: string;
	icon: React.ReactNode;
}) => (
	<div
		className="flex flex-col gap-3 rounded-2xl p-5 text-white"
		style={{ backgroundColor: bg }}
	>
		<div className="flex items-center justify-between">
			<p className="text-[12px] font-medium opacity-80">{label}</p>
			<span className="opacity-80">{icon}</span>
		</div>
		<p className="text-[30px] font-bold leading-none">{value}</p>
		<p className="text-[12px] font-medium opacity-75">{sub}</p>
	</div>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({
	title,
	subtitle,
	children,
	className,
}: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	className?: string;
}) => (
	<div
		className={clsx(
			"rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-5",
			className
		)}
	>
		<div className="mb-4">
			<h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
				{title}
			</h3>
			{subtitle && (
				<p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>
			)}
		</div>
		{children}
	</div>
);

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: { name: string; value: number; color: string }[];
	label?: string;
}) => {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-lg text-[12px] dark:border-slate-700 dark:bg-slate-900">
			{label && (
				<p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
					{label}
				</p>
			)}
			{payload.map((p) => (
				<p key={p.name} style={{ color: p.color }}>
					{p.name}:{" "}
					<span className="font-bold">{p.value.toLocaleString()}</span>
				</p>
			))}
		</div>
	);
};

// ─── Donut legend item ────────────────────────────────────────────────────────

const LegendItem = ({
	color,
	label,
	pct,
}: {
	color: string;
	label: string;
	pct: number;
}) => (
	<div className="flex items-center justify-between gap-4">
		<div className="flex items-center gap-2">
			<span
				className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
				style={{ backgroundColor: color }}
			/>
			<span className="text-[13px] text-slate-600 dark:text-slate-300">
				{label}
			</span>
		</div>
		<span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
			{pct}%
		</span>
	</div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const AnalyticsPage = () => (
	<section className="space-y-5 w-full">
		{/* Header */}
		<div className="px-2">
			<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
				Analytics & Reports
			</h2>
			<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
				Deep dive into platform metrics and performance
			</p>
		</div>

		{/* KPI Cards */}
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<KpiCard
				label="Platform Growth"
				value="+24.5%"
				sub="vs last month"
				bg="#1e40af"
				icon={
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						strokeWidth={2.5}
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M3 3v18h18M7 16l4-4 4 4 4-4"
						/>
					</svg>
				}
			/>
			<KpiCard
				label="User Engagement"
				value="87.3%"
				sub="Active users"
				bg="#7c3aed"
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 32 32"
						fill="none"
					>
						<g opacity="0.9">
							<path
								d="M21.3335 27.9995V25.333C21.3335 23.9186 20.7716 22.5621 19.7715 21.562C18.7713 20.5619 17.4149 20 16.0005 20H8.00097C6.58657 20 5.2301 20.5619 4.22997 21.562C3.22984 22.5621 2.66797 23.9186 2.66797 25.333V27.9995"
								stroke="white"
								strokeWidth="2.6665"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M12.001 14.666C14.9463 14.666 17.334 12.2783 17.334 9.333C17.334 6.38767 14.9463 4 12.001 4C9.05563 4 6.66797 6.38767 6.66797 9.333C6.66797 12.2783 9.05563 14.666 12.001 14.666Z"
								stroke="white"
								strokeWidth="2.6665"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M29.3318 27.9981V25.3316C29.3309 24.1499 28.9376 23.0021 28.2137 22.0682C27.4897 21.1343 26.4761 20.4673 25.332 20.1719"
								stroke="white"
								strokeWidth="2.6665"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M21.332 4.17188C22.4792 4.46559 23.4959 5.13275 24.222 6.06817C24.9481 7.00359 25.3422 8.15407 25.3422 9.33822C25.3422 10.5224 24.9481 11.6728 24.222 12.6083C23.4959 13.5437 22.4792 14.2108 21.332 14.5046"
								stroke="white"
								strokeWidth="2.6665"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</g>
					</svg>
				}
			/>
			<KpiCard
				label="Job Success Rate"
				value="72%"
				sub="Positions filled"
				bg="#f97316"
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 32 32"
						fill="none"
					>
						<g opacity="0.9">
							<path
								d="M21.3301 26.6626V5.33056C21.3301 4.62336 21.0491 3.94513 20.5491 3.44506C20.049 2.945 19.3708 2.66406 18.6636 2.66406H13.3306C12.6234 2.66406 11.9451 2.945 11.4451 3.44506C10.945 3.94513 10.6641 4.62336 10.6641 5.33056V26.6626"
								stroke="white"
								strokeWidth="2.6665"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M26.6665 8H5.33447C3.8618 8 2.66797 9.19383 2.66797 10.6665V23.999C2.66797 25.4717 3.8618 26.6655 5.33447 26.6655H26.6665C28.1391 26.6655 29.333 25.4717 29.333 23.999V10.6665C29.333 9.19383 28.1391 8 26.6665 8Z"
								stroke="white"
								strokeWidth="2.6665"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</g>
					</svg>
				}
			/>
			<KpiCard
				label="Revenue Growth"
				value="+18.2%"
				sub="Monthly increase"
				bg="#16a34a"
				icon={
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						strokeWidth={2.5}
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
				}
			/>
		</div>

		{/* User Growth + Job Distribution */}
		<div className="grid gap-4 lg:grid-cols-2">
			<Section
				title="User Growth Trend"
				subtitle="Companies vs candidates over time"
			>
				<ResponsiveContainer width="100%" height={220}>
					<LineChart
						data={USER_GROWTH_DATA}
						margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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
						/>
						<Tooltip content={<ChartTooltip />} />
						<Legend
							iconType="circle"
							iconSize={8}
							wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
						/>
						<Line
							type="monotone"
							dataKey="companies"
							name="Companies"
							stroke="#1d4ed8"
							strokeWidth={2.5}
							dot={{ r: 4, fill: "#1d4ed8" }}
							activeDot={{ r: 6 }}
						/>
						<Line
							type="monotone"
							dataKey="candidates"
							name="Candidates"
							stroke="#7c3aed"
							strokeWidth={2.5}
							dot={{ r: 4, fill: "#7c3aed" }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</Section>

			<Section title="Job Distribution" subtitle="Jobs by category">
				<div className="flex items-center gap-6">
					<ResponsiveContainer width={180} height={180}>
						<PieChart>
							<Pie
								data={JOB_DISTRIBUTION}
								cx="50%"
								cy="50%"
								innerRadius={55}
								outerRadius={82}
								paddingAngle={2}
								dataKey="value"
								fill="#1e3a5f"
							/>
						</PieChart>
					</ResponsiveContainer>
					<div className="flex flex-col gap-3 flex-1">
						{JOB_DISTRIBUTION.map((d) => (
							<LegendItem
								key={d.name}
								color={d.fill}
								label={d.name}
								pct={d.value}
							/>
						))}
					</div>
				</div>
			</Section>
		</div>

		{/* Hiring Funnel */}
		<Section
			title="Hiring Funnel Analysis"
			subtitle="Application-to-hire conversion rates"
		>
			<ResponsiveContainer width="100%" height={220}>
				<BarChart
					data={HIRING_FUNNEL}
					layout="vertical"
					barSize={100}
					margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
					barCategoryGap="30%"
				>
					<CartesianGrid
						strokeDasharray="3 3"
						horizontal={false}
						stroke="#f1f5f9"
					/>
					<XAxis
						type="number"
						tick={{ fontSize: 11, fill: "#94a3b8" }}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						type="category"
						dataKey="stage"
						tick={{ fontSize: 12, fill: "#64748b" }}
						axisLine={false}
						tickLine={false}
						width={90}
					/>
					<Tooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							return (
								<div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg text-[12px] dark:border-slate-700 dark:bg-slate-900">
									<p className="font-bold text-slate-700 dark:text-slate-200">
										{payload[0].value?.toLocaleString()} applicants
									</p>
								</div>
							);
						}}
					/>
					<Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#005CA9" />
				</BarChart>
			</ResponsiveContainer>
		</Section>

		{/* Performance Metrics */}
		<Section title="Performance Metrics">
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
				{PERFORMANCE_METRICS.map((m) => (
					<div
						key={m.label}
						className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900"
					>
						<p className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
							{m.label}
						</p>
						<p className="text-[26px] font-bold text-slate-900 dark:text-slate-50 leading-tight">
							{m.value}
						</p>
						<p
							className="text-[11px] font-semibold"
							style={{ color: m.subColor }}
						>
							{m.sub}
						</p>
					</div>
				))}
			</div>
		</Section>
	</section>
);

export default AnalyticsPage;
