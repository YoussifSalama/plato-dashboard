"use client";

import { useState } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
} from "recharts";
import {
	Download,
	Search,
	SlidersHorizontal,
	X,
	ChevronDown,
	Check,
	CheckCircle,
	XCircle,
	Activity,
	Database,
} from "lucide-react";
import clsx from "clsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaginationBar from "@/shared/common/features/PaginationBar";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = "CREATE" | "UPDATE" | "DELETE";
type SourceType = "ADMIN" | "API" | "WEBHOOK" | "CRON";
type StatusType = "SUCCESS" | "FAILED";

type LogEntry = {
	id: number;
	timestamp: string;
	table: string;
	recordId: string;
	action: ActionType;
	changedBy: string;
	changedByRole: string;
	source: SourceType;
	status: StatusType;
	errorMsg?: string;
	ip: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const ACTIVITY_DATA = [
	{ date: "Mar 01", success: 148, failed: 12, total: 160 },
	{ date: "Mar 08", success: 183, failed: 18, total: 201 },
	{ date: "Mar 15", success: 215, failed: 14, total: 229 },
	{ date: "Mar 22", success: 298, failed: 22, total: 320 },
	{ date: "Mar 29", success: 270, failed: 30, total: 300 },
	{ date: "Apr 05", success: 310, failed: 20, total: 330 },
	{ date: "Apr 12", success: 245, failed: 16, total: 261 },
];

const DISTRIBUTION_DATA = [
	{ name: "SUCCESS", value: 55, fill: "#1d4ed8" },
	{ name: "UPDATE", value: 36, fill: "#22c55e" },
	{ name: "FAILED", value: 9, fill: "#ef4444" },
];

const MOCK_LOGS: LogEntry[] = [
	{
		id: 1,
		timestamp: "2026-03-29 10:34:22",
		table: "users",
		recordId: "usr_001",
		action: "CREATE",
		changedBy: "admin@plato.com",
		changedByRole: "super_admin",
		source: "ADMIN",
		status: "SUCCESS",
		ip: "192.168.1.1",
	},
	{
		id: 2,
		timestamp: "2026-03-29 10:22:15",
		table: "jobs",
		recordId: "job_046",
		action: "UPDATE",
		changedBy: "admin@plato.com",
		changedByRole: "company_admin",
		source: "API",
		status: "SUCCESS",
		ip: "192.168.1.45",
	},
	{
		id: 3,
		timestamp: "2026-03-29 10:15:09",
		table: "subscriptions",
		recordId: "sub_334",
		action: "DELETE",
		changedBy: "system@plato.com",
		changedByRole: "system",
		source: "ADMIN",
		status: "FAILED",
		errorMsg: "Foreign key constraint violation",
		ip: "127.0.0.1",
	},
	{
		id: 4,
		timestamp: "2026-03-29 10:06:45",
		table: "applications",
		recordId: "app_789",
		action: "CREATE",
		changedBy: "candidate@email.com",
		changedByRole: "candidate",
		source: "API",
		status: "SUCCESS",
		ip: "203.45.67.89",
	},
	{
		id: 5,
		timestamp: "2026-03-29 09:55:12",
		table: "interviews",
		recordId: "int_156",
		action: "UPDATE",
		changedBy: "admin@plato.com",
		changedByRole: "super_admin",
		source: "ADMIN",
		status: "SUCCESS",
		ip: "192.168.1.1",
	},
	{
		id: 6,
		timestamp: "2026-03-29 09:45:18",
		table: "vouchers",
		recordId: "vch_023",
		action: "CREATE",
		changedBy: "admin@plato.com",
		changedByRole: "super_admin",
		source: "ADMIN",
		status: "SUCCESS",
		ip: "192.168.1.1",
	},
	{
		id: 7,
		timestamp: "2026-03-29 09:30:55",
		table: "payments",
		recordId: "pay_970",
		action: "UPDATE",
		changedBy: "webhook@stripe.com",
		changedByRole: "webhook",
		source: "WEBHOOK",
		status: "SUCCESS",
		ip: "54.187.174.169",
	},
	{
		id: 8,
		timestamp: "2026-03-29 09:20:12",
		table: "users",
		recordId: "usr_140",
		action: "DELETE",
		changedBy: "admin@plato.com",
		changedByRole: "super_admin",
		source: "ADMIN",
		status: "FAILED",
		errorMsg: "Cannot delete user with active subscriptions",
		ip: "192.168.1.1",
	},
	{
		id: 9,
		timestamp: "2026-03-28 18:45:33",
		table: "jobs",
		recordId: "job_112",
		action: "CREATE",
		changedBy: "api@plato.com",
		changedByRole: "api_service",
		source: "API",
		status: "SUCCESS",
		ip: "10.0.0.5",
	},
	{
		id: 10,
		timestamp: "2026-03-28 17:22:10",
		table: "candidates",
		recordId: "cnd_455",
		action: "UPDATE",
		changedBy: "admin@plato.com",
		changedByRole: "super_admin",
		source: "ADMIN",
		status: "SUCCESS",
		ip: "192.168.1.1",
	},
	{
		id: 11,
		timestamp: "2026-03-28 16:55:02",
		table: "quotas",
		recordId: "qta_009",
		action: "UPDATE",
		changedBy: "system@plato.com",
		changedByRole: "system",
		source: "API",
		status: "SUCCESS",
		ip: "127.0.0.1",
	},
	{
		id: 12,
		timestamp: "2026-03-28 15:10:44",
		table: "subscriptions",
		recordId: "sub_210",
		action: "CREATE",
		changedBy: "admin@plato.com",
		changedByRole: "company_admin",
		source: "CRON",
		status: "SUCCESS",
		ip: "192.168.2.34",
	},
	{
		id: 13,
		timestamp: "2026-03-28 14:03:20",
		table: "content",
		recordId: "cnt_088",
		action: "UPDATE",
		changedBy: "admin@plato.com",
		changedByRole: "super_admin",
		source: "ADMIN",
		status: "SUCCESS",
		ip: "192.168.1.1",
	},
	{
		id: 14,
		timestamp: "2026-03-28 13:45:57",
		table: "users",
		recordId: "usr_302",
		action: "DELETE",
		changedBy: "api@plato.com",
		changedByRole: "api_service",
		source: "API",
		status: "FAILED",
		errorMsg: "Record not found",
		ip: "10.0.0.5",
	},
	{
		id: 15,
		timestamp: "2026-03-28 12:30:11",
		table: "vouchers",
		recordId: "vch_041",
		action: "UPDATE",
		changedBy: "admin@plato.com",
		changedByRole: "super_admin",
		source: "ADMIN",
		status: "SUCCESS",
		ip: "192.168.1.1",
	},
	{
		id: 16,
		timestamp: "2026-03-27 22:11:05",
		table: "payments",
		recordId: "pay_321",
		action: "CREATE",
		changedBy: "webhook@stripe.com",
		changedByRole: "webhook",
		source: "WEBHOOK",
		status: "SUCCESS",
		ip: "54.187.174.169",
	},
];

const TABLE_OPTIONS = [
	"All Tables",
	"users",
	"jobs",
	"subscriptions",
	"applications",
	"interviews",
	"vouchers",
	"payments",
	"candidates",
	"quotas",
	"content",
];

const ACTION_OPTIONS: (ActionType | "all")[] = [
	"all",
	"CREATE",
	"UPDATE",
	"DELETE",
];
const STATUS_OPTIONS: (StatusType | "all")[] = ["all", "SUCCESS", "FAILED"];
const SOURCE_OPTIONS: (SourceType | "all")[] = [
	"all",
	"ADMIN",
	"API",
	"WEBHOOK",
	"CRON",
];

const PAGE_SIZE = 8;

// ─── Badge helpers ────────────────────────────────────────────────────────────

const ACTION_STYLES: Record<ActionType, string> = {
	CREATE:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	UPDATE: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
	DELETE: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
};

const SOURCE_STYLES: Record<SourceType, string> = {
	ADMIN: "bg-[#005CA91A] text-[#005CA9]",
	API: "bg-[#905DF81A] text-[#905DF8]",
	WEBHOOK: "bg-[#48BB781A] text-[#48BB78]",
	CRON: "bg-[#F6AD551A] text-[#F6AD55]",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
	icon,
	iconBg,
	iconColor,
	label,
	value,
	sub,
	subColor,
}: {
	icon: React.ReactNode;
	iconBg: string;
	iconColor: string;
	label: string;
	value: string;
	sub?: string;
	subColor?: string;
}) => (
	<div className="flex items-start gap-4 rounded-2xl bg-white border border-slate-100 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
		<div
			className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
			style={{ backgroundColor: iconBg }}
		>
			<span style={{ color: iconColor }}>{icon}</span>
		</div>
		<div>
			<p className="text-[12px] font-medium text-slate-400">{label}</p>
			<p className="mt-0.5 text-[26px] font-bold text-slate-900 dark:text-slate-50 leading-tight">
				{value}
			</p>
			{sub && (
				<p
					className="text-[11px] font-semibold mt-0.5"
					style={{ color: subColor }}
				>
					{sub}
				</p>
			)}
		</div>
	</div>
);

// ─── Chart tooltip ────────────────────────────────────────────────────────────

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
			{label && <p className="font-semibold text-slate-500 mb-1">{label}</p>}
			{payload.map((p) => (
				<p key={p.name} style={{ color: p.color }}>
					{p.name}:{" "}
					<span className="font-bold">{p.value.toLocaleString()}</span>
				</p>
			))}
		</div>
	);
};

// ─── Pill filter dropdown ─────────────────────────────────────────────────────

function FilterDropdown<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: T[];
	onChange: (v: T) => void;
}) {
	const display = value === "all" ? label : value;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={clsx(
						"flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors",
						value !== "all"
							? "border-[#005ca9] bg-blue-50 text-[#005ca9] dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-400"
							: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
					)}
				>
					{display}
					<ChevronDown className="h-3 w-3" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-36 rounded-xl p-1.5 dark:bg-slate-900 dark:border-slate-800"
			>
				{options.map((opt) => (
					<DropdownMenuItem
						key={opt}
						onClick={() => onChange(opt)}
						className={clsx(
							"flex items-center justify-between rounded-lg text-[12px] cursor-pointer capitalize",
							value === opt && "font-semibold"
						)}
					>
						{opt === "all" ? label : opt}
						{value === opt && <Check className="h-3 w-3 text-blue-500" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LogsPage = () => {
	const [search, setSearch] = useState("");
	const [tableFilter, setTable] = useState("All Tables");
	const [actionFilter, setAction] = useState<ActionType | "all">("all");
	const [statusFilter, setStatus] = useState<StatusType | "all">("all");
	const [sourceFilter, setSource] = useState<SourceType | "all">("all");
	const [showFilters, setShowFilters] = useState(false);
	const [page, setPage] = useState(1);

	const filtered = MOCK_LOGS.filter((l) => {
		const matchSearch =
			!search ||
			[l.table, l.recordId, l.changedBy, l.ip].some((v) =>
				v.toLowerCase().includes(search.toLowerCase())
			);
		const matchTable = tableFilter === "All Tables" || l.table === tableFilter;
		const matchAction = actionFilter === "all" || l.action === actionFilter;
		const matchStatus = statusFilter === "all" || l.status === statusFilter;
		const matchSource = sourceFilter === "all" || l.source === sourceFilter;
		return (
			matchSearch && matchTable && matchAction && matchStatus && matchSource
		);
	});

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const hasFilters =
		tableFilter !== "All Tables" ||
		actionFilter !== "all" ||
		statusFilter !== "all" ||
		sourceFilter !== "all" ||
		search !== "";

	const clearAll = () => {
		setSearch("");
		setTable("All Tables");
		setAction("all");
		setStatus("all");
		setSource("all");
		setPage(1);
	};

	const successCount = MOCK_LOGS.filter((l) => l.status === "SUCCESS").length;
	const failedCount = MOCK_LOGS.filter((l) => l.status === "FAILED").length;

	return (
		<section className="space-y-5 w-full">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						System Logs
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Monitor system activity and track changes
					</p>
				</div>
				<button className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors shadow-sm self-start sm:self-auto">
					<Download className="h-4 w-4" />
					Export Logs
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					icon={<Database className="w-4 h-4" />}
					iconBg="#dbeafe"
					iconColor="#2563eb"
					label="Total Logs"
					value="1,436"
					sub="Last 7 days"
				/>
				<StatCard
					icon={<CheckCircle className="h-5 w-5" />}
					iconBg="#dcfce7"
					iconColor="#16a34a"
					label="Success Rate"
					value={`${Math.round((successCount / MOCK_LOGS.length) * 1000) / 10}%`}
					sub="+0.3% improvement"
					subColor="#22c55e"
				/>
				<StatCard
					icon={
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
						>
							<path
								d="M11.9934 21.9868C17.5126 21.9868 21.9868 17.5126 21.9868 11.9934C21.9868 6.4742 17.5126 2 11.9934 2C6.4742 2 2 6.4742 2 11.9934C2 17.5126 6.4742 21.9868 11.9934 21.9868Z"
								stroke="#E53E3E"
								strokeWidth="1.99868"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M11.9922 7.99609V11.9935"
								stroke="#E53E3E"
								strokeWidth="1.99868"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M11.9922 15.9883H12.0022"
								stroke="#E53E3E"
								strokeWidth="1.99868"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					}
					iconBg="#fee2e2"
					iconColor="#dc2626"
					label="Failed Actions"
					value={String(failedCount)}
					sub="Requires attention"
					subColor="#ef4444"
				/>
				<StatCard
					icon={<Activity className="w-4 h-4" />}
					iconBg="#ede9fe"
					iconColor="#7c3aed"
					label="API Calls"
					value="645"
					sub="Today's activity"
				/>
			</div>

			{/* Charts row */}
			<div className="grid gap-4 xl:grid-cols-[1fr_500px]">
				{/* Activity Trend */}
				<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-5">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
							Activity Trend
						</h3>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-slate-300 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
								>
									{tableFilter}
									<ChevronDown className="h-3 w-3 text-slate-400" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-44 rounded-xl p-1.5 max-h-64 overflow-y-auto dark:bg-slate-900 dark:border-slate-800"
							>
								{TABLE_OPTIONS.map((t) => (
									<DropdownMenuItem
										key={t}
										onClick={() => setTable(t)}
										className={clsx(
											"flex items-center justify-between rounded-lg text-[12px] cursor-pointer",
											tableFilter === t && "font-semibold"
										)}
									>
										{t}
										{tableFilter === t && (
											<Check className="h-3 w-3 text-blue-500" />
										)}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<ResponsiveContainer width="100%" height={300}>
						<LineChart
							data={ACTIVITY_DATA}
							margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
							<XAxis
								dataKey="date"
								tick={{ fontSize: 10, fill: "#94a3b8" }}
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={{ fontSize: 10, fill: "#94a3b8" }}
								axisLine={false}
								tickLine={false}
							/>
							<Tooltip content={<ChartTooltip />} />
							<Legend
								iconType="circle"
								iconSize={7}
								wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
							/>
							<Line
								type="monotone"
								dataKey="success"
								name="Success"
								stroke="#22c55e"
								strokeWidth={2}
								dot={{ r: 3 }}
							/>
							<Line
								type="monotone"
								dataKey="failed"
								name="Failed"
								stroke="#ef4444"
								strokeWidth={2}
								dot={{ r: 3 }}
							/>
							<Line
								type="monotone"
								dataKey="total"
								name="Total"
								stroke="#1d4ed8"
								strokeWidth={2}
								dot={{ r: 3 }}
								strokeDasharray="4 2"
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>

				{/* Action Distribution */}
				<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-5">
					<h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-4">
						Action Distribution
					</h3>
					<div className="flex justify-center">
						<ResponsiveContainer width="100%" height={250}>
							<PieChart>
								<Pie
									data={DISTRIBUTION_DATA}
									cx="50%"
									cy="50%"
									innerRadius={0}
									outerRadius={75}
									paddingAngle={2}
									dataKey="value"
									label={({ percent, index }) =>
										`(${index + 1}) ${Math.round((percent ?? 0) * 100)}%`
									}
									labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
								/>
								<Tooltip
									formatter={(value) => [`${value}%`, ""]}
									contentStyle={{ fontSize: 12, borderRadius: 10 }}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-2 space-y-2">
						{DISTRIBUTION_DATA.map((d, i) => (
							<div
								key={d.name}
								className="flex items-center justify-between text-[12px]"
							>
								<div className="flex items-center gap-2">
									<span
										className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
										style={{ backgroundColor: d.fill }}
									/>
									<span className="text-slate-500 dark:text-slate-400">
										({i + 1}) {d.name}
									</span>
								</div>
								<span className="font-bold text-slate-700 dark:text-slate-200">
									{d.value}%
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Filters & Table */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
				{/* Filter header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
					<h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
						Filters & Search
					</h3>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setShowFilters((p) => !p)}
							className={clsx(
								"inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition-colors",
								showFilters
									? "border-[#005ca9] bg-blue-50 text-[#005ca9] dark:bg-blue-950/30 dark:border-blue-700"
									: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
							)}
						>
							<SlidersHorizontal className="h-3.5 w-3.5" />
							Show Filters
						</button>
						{hasFilters && (
							<button
								onClick={clearAll}
								className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:border-slate-300 hover:text-red-500 transition-colors dark:border-slate-700 dark:bg-slate-900"
							>
								<X className="h-3.5 w-3.5" />
								Clear All
							</button>
						)}
					</div>
				</div>

				{/* Search */}
				<div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
					<div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-300 focus-within:bg-white transition-colors dark:border-slate-700 dark:bg-slate-900">
						<Search className="h-4 w-4 text-slate-400 shrink-0" />
						<input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Search by table name, record ID, or user..."
							className="w-full bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200"
						/>
					</div>
				</div>

				{/* Expanded filter pills */}
				{showFilters && (
					<div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
						<FilterDropdown
							label="Action"
							value={actionFilter}
							options={ACTION_OPTIONS}
							onChange={(v) => {
								setAction(v);
								setPage(1);
							}}
						/>
						<FilterDropdown
							label="Status"
							value={statusFilter}
							options={STATUS_OPTIONS}
							onChange={(v) => {
								setStatus(v);
								setPage(1);
							}}
						/>
						<FilterDropdown
							label="Source"
							value={sourceFilter}
							options={SOURCE_OPTIONS}
							onChange={(v) => {
								setSource(v);
								setPage(1);
							}}
						/>
					</div>
				)}

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full min-w-225">
						<thead>
							<tr className="border-b border-slate-100 dark:border-slate-800">
								{[
									"TIMESTAMP",
									"TABLE",
									"RECORD ID",
									"ACTION",
									"CHANGED BY",
									"SOURCE",
									"STATUS",
									"IP ADDRESS",
								].map((h) => (
									<th
										key={h}
										className="px-5 py-3 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase whitespace-nowrap"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{paginated.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="py-16 text-center text-[14px] text-slate-400"
									>
										No logs found.
									</td>
								</tr>
							) : (
								paginated.map((log) => (
									<tr
										key={log.id}
										className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
									>
										<td className="px-5 py-3.5 text-[12px] text-slate-400 whitespace-nowrap font-mono">
											{log.timestamp}
										</td>
										<td className="px-5 py-3.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
											{log.table}
										</td>
										<td className="px-5 py-3.5 text-[12px] font-mono text-slate-500 dark:text-slate-400">
											{log.recordId}
										</td>
										<td className="px-5 py-3.5">
											<span
												className={clsx(
													"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold",
													ACTION_STYLES[log.action]
												)}
											>
												{log.action}
											</span>
										</td>
										<td className="px-5 py-3.5">
											<p className="text-[12px] text-slate-700 dark:text-slate-200">
												{log.changedBy}
											</p>
											<p className="text-[11px] text-slate-400">
												{log.changedByRole}
											</p>
										</td>
										<td className="px-5 py-3.5">
											<span
												className={clsx(
													"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold",
													SOURCE_STYLES[log.source]
												)}
											>
												{log.source}
											</span>
										</td>
										<td className="px-5 py-3.5">
											{log.status === "SUCCESS" ? (
												<div className="flex items-center gap-1.5">
													<CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
													<span className="text-[12px] font-semibold text-emerald-600">
														SUCCESS
													</span>
												</div>
											) : (
												<div>
													<div className="flex items-center gap-1.5">
														<XCircle className="h-4 w-4 text-red-500 shrink-0" />
														<span className="text-[12px] font-semibold text-red-500">
															FAILED
														</span>
													</div>
													{log.errorMsg && (
														<p className="text-[10px] text-red-400 mt-0.5 max-w-45">
															{log.errorMsg}
														</p>
													)}
												</div>
											)}
										</td>
										<td className="px-5 py-3.5 text-[12px] font-mono text-slate-400 whitespace-nowrap">
											{log.ip}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
					<p className="text-[12px] text-slate-400">
						Showing{" "}
						<span className="font-semibold text-slate-600 dark:text-slate-300">
							{paginated.length}
						</span>{" "}
						of{" "}
						<span className="font-semibold text-slate-600 dark:text-slate-300">
							{filtered.length}
						</span>{" "}
						logs
					</p>
					<PaginationBar
						currentPage={page}
						totalPages={totalPages}
						totalItems={filtered.length}
						itemName="logs"
						pageSize={PAGE_SIZE}
						onPageChange={setPage}
						className="border-0 shadow-none p-0"
					/>
				</div>
			</div>
		</section>
	);
};

export default LogsPage;
