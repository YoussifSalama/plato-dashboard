"use client";

import { useState, useEffect } from "react";
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
	Clock,
} from "lucide-react";
import clsx from "clsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaginationBar from "@/shared/common/features/PaginationBar";
import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType =
	| "CREATE"
	| "UPDATE"
	| "DELETE"
	| "BACKGROUND_JOB"
	| `WS:${string}`;
type SourceType = "ADMIN" | "API" | "WEBHOOK" | "CRON" | "WEBSOCKET";
type StatusType = "SUCCESS" | "FAILED" | "PENDING";

type LogEntry = {
	id: string | number;
	timestamp: string;
	table: string;
	recordId?: string;
	action: ActionType;
	changedBy: string;
	changedByRole: string;
	source: SourceType;
	status: StatusType;
	errorMsg?: string;
	ip?: string;
};

type SummaryData = {
	stats: {
		total: number;
		successRate: number;
		failedCount: number;
		apiCalls: number;
	};
	activityTrend: {
		date: string;
		success: number;
		failed: number;
		total: number;
	}[];
	actionDistribution: { name: string; value: number; fill: string }[];
	tableOptions: string[];
};

// ─── Mock data (shown when API returns no records) ────────────────────────────

const MOCK_ACTIVITY_DATA = [
	{ date: "Mar 01", success: 148, failed: 12, total: 160 },
	{ date: "Mar 08", success: 183, failed: 18, total: 201 },
	{ date: "Mar 15", success: 215, failed: 14, total: 229 },
	{ date: "Mar 22", success: 298, failed: 22, total: 320 },
	{ date: "Mar 29", success: 270, failed: 30, total: 300 },
	{ date: "Apr 05", success: 310, failed: 20, total: 330 },
	{ date: "Apr 12", success: 245, failed: 16, total: 261 },
];

const MOCK_DISTRIBUTION_DATA = [
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
		ip: "127.0.0.1",
		errorMsg: "Foreign key constraint violation",
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
		ip: "192.168.1.1",
		errorMsg: "Cannot delete user with active subscriptions",
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
		ip: "10.0.0.5",
		errorMsg: "Record not found",
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

const MOCK_TABLE_OPTIONS = [
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
	"BACKGROUND_JOB",
];
const STATUS_OPTIONS: (StatusType | "all")[] = [
	"all",
	"SUCCESS",
	"FAILED",
	"PENDING",
];
const SOURCE_OPTIONS: (SourceType | "all")[] = [
	"all",
	"ADMIN",
	"API",
	"WEBHOOK",
	"CRON",
	"WEBSOCKET",
];
const PAGE_SIZE = 8;

// ─── Badge helpers ────────────────────────────────────────────────────────────

const ACTION_STYLES: Record<ActionType, string> = {
	CREATE:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	UPDATE: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
	DELETE: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
	BACKGROUND_JOB:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
};
function getActionStyle(action: ActionType): string {
	if (action.startsWith("WS:")) {
		return "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400";
	}

	return ACTION_STYLES[action] ?? "";
}

const SOURCE_STYLES: Record<SourceType, string> = {
	ADMIN: "bg-[#005CA91A] text-[#005CA9]",
	API: "bg-[#905DF81A] text-[#905DF8]",
	WEBHOOK: "bg-[#48BB781A] text-[#48BB78]",
	CRON: "bg-[#F6AD551A] text-[#F6AD55]",
	WEBSOCKET: "bg-[#005CA91A] text-[#005CA9]",
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

// ─── Filter dropdown ──────────────────────────────────────────────────────────

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LogsSkeleton() {
	return (
		<section className="space-y-5 w-full animate-pulse">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
				<div className="space-y-2">
					<div className="h-7 w-36 rounded-lg bg-slate-200" />
					<div className="h-4 w-56 rounded bg-slate-100" />
				</div>
				<div className="h-10 w-32 rounded-xl bg-slate-200" />
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="flex items-start gap-4 rounded-2xl bg-white border border-slate-100 p-5"
					>
						<div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200" />
						<div className="flex-1 space-y-2">
							<div className="h-3 w-20 rounded bg-slate-200" />
							<div className="h-7 w-16 rounded bg-slate-200" />
							<div className="h-2.5 w-24 rounded bg-slate-100" />
						</div>
					</div>
				))}
			</div>

			{/* Charts */}
			<div className="grid gap-4 xl:grid-cols-[1fr_500px]">
				<div className="rounded-2xl bg-white border border-slate-100 p-5 space-y-3">
					<div className="h-5 w-32 rounded bg-slate-200" />
					<div className="h-[300px] rounded-xl bg-slate-100" />
				</div>
				<div className="rounded-2xl bg-white border border-slate-100 p-5 space-y-3">
					<div className="h-5 w-36 rounded bg-slate-200" />
					<div className="h-[250px] rounded-xl bg-slate-100" />
					<div className="space-y-2 mt-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between">
								<div className="h-3 w-24 rounded bg-slate-200" />
								<div className="h-3 w-8 rounded bg-slate-200" />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Table card */}
			<div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
				{/* Filter bar */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
					<div className="h-4 w-28 rounded bg-slate-200" />
					<div className="flex gap-2">
						<div className="h-8 w-20 rounded-xl bg-slate-200" />
						<div className="h-8 w-24 rounded-xl bg-slate-200" />
					</div>
				</div>
				{/* Search bar */}
				<div className="px-5 py-3 border-b border-slate-100">
					<div className="h-9 w-full rounded-xl bg-slate-100" />
				</div>
				{/* Table rows */}
				<div className="divide-y divide-slate-100">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="flex items-center gap-4 px-5 py-3.5">
							<div className="h-3 w-32 rounded bg-slate-200" />
							<div className="h-5 w-14 rounded-full bg-slate-200" />
							<div className="h-3 w-20 rounded bg-slate-100 flex-1" />
							<div className="h-3 w-28 rounded bg-slate-100" />
							<div className="h-5 w-16 rounded-full bg-slate-200" />
							<div className="h-5 w-16 rounded-full bg-slate-100" />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LogsPage = () => {
	// Filter state
	const [search, setSearch] = useState("");
	const [tableFilter, setTable] = useState("All Tables");
	const [actionFilter, setAction] = useState<ActionType | "all">("all");
	const [statusFilter, setStatus] = useState<StatusType | "all">("all");
	const [sourceFilter, setSource] = useState<SourceType | "all">("all");
	const [showFilters, setShowFilters] = useState(false);
	const [page, setPage] = useState(1);
	const [exporting, setExporting] = useState(false);

	// API data state
	const [apiLogs, setApiLogs] = useState<LogEntry[]>([]);
	const [apiTotal, setApiTotal] = useState(0);
	const [summary, setSummary] = useState<SummaryData | null>(null);
	const [usingMock, setUsingMock] = useState(false);
	const [loadingLogs, setLoadingLogs] = useState(true);
	const [tableOptions, setTableOptions] =
		useState<string[]>(MOCK_TABLE_OPTIONS);

	// ── Fetch summary once on mount ─────────────────────────────────────────

	useEffect(() => {
		apiClient
			.get("/api/logs/summary")
			.then((res) => {
				const data: SummaryData = res.data?.data;
				if (data) {
					setSummary(data);
					if (data.tableOptions?.length) setTableOptions(data.tableOptions);
				}
			})
			.catch(() => {
				/* summary stays null, mock used */
			});
	}, []);

	// ── Fetch logs on every filter / page change ────────────────────────────

	useEffect(() => {
		apiClient
			.get("/api/logs", {
				params: {
					page,
					limit: PAGE_SIZE,
					search,
					table: tableFilter !== "All Tables" ? tableFilter : "",
					action: actionFilter !== "all" ? actionFilter : "",
					status: statusFilter !== "all" ? statusFilter : "",
					source: sourceFilter !== "all" ? sourceFilter : "",
				},
			})
			.then((res) => {
				const data: LogEntry[] = res.data?.data ?? [];
				const grandTotal: number = res.data?.meta?.grand_total ?? 0;
				const total: number = res.data?.meta?.total ?? 0;

				if (grandTotal === 0) {
					setUsingMock(true);
					setApiLogs([]);
					setApiTotal(0);
				} else {
					setUsingMock(false);
					setApiLogs(data);
					setApiTotal(total);
				}
			})
			.catch(() => {
				setUsingMock(true);
				setApiLogs([]);
				setApiTotal(0);
			})
			.finally(() => setLoadingLogs(false));
	}, [page, search, tableFilter, actionFilter, statusFilter, sourceFilter]);

	// ── Derive display data ─────────────────────────────────────────────────

	// When using mock: filter client-side
	const mockFiltered = usingMock
		? MOCK_LOGS.filter((l) => {
				const matchSearch =
					!search ||
					[l.table, l.recordId, l.changedBy, l.ip].some((v) =>
						v?.toLowerCase().includes(search.toLowerCase())
					);
				const matchTable =
					tableFilter === "All Tables" || l.table === tableFilter;
				const matchAction = actionFilter === "all" || l.action === actionFilter;
				const matchStatus = statusFilter === "all" || l.status === statusFilter;
				const matchSource = sourceFilter === "all" || l.source === sourceFilter;
				return (
					matchSearch && matchTable && matchAction && matchStatus && matchSource
				);
			})
		: [];

	const displayLogs = usingMock
		? mockFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
		: apiLogs;
	const displayTotal = usingMock ? mockFiltered.length : apiTotal;
	const totalPages = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE));
	const paginated = displayLogs; // already paginated (server) or sliced (mock)

	// Stats values: use real API data if available, else mock
	const mockSuccessCount = MOCK_LOGS.filter(
		(l) => l.status === "SUCCESS"
	).length;
	const mockFailedCount = MOCK_LOGS.filter((l) => l.status === "FAILED").length;

	const statsTotal =
		!usingMock && summary ? summary.stats.total.toLocaleString() : "1,436";
	const statsSuccessRate =
		!usingMock && summary
			? `${summary.stats.successRate}%`
			: `${Math.round((mockSuccessCount / MOCK_LOGS.length) * 1000) / 10}%`;
	const statsFailedCount =
		!usingMock && summary
			? String(summary.stats.failedCount)
			: String(mockFailedCount);
	const statsApiCalls =
		!usingMock && summary ? summary.stats.apiCalls.toLocaleString() : "645";

	const activityData =
		!usingMock && summary?.activityTrend?.length
			? summary.activityTrend
			: MOCK_ACTIVITY_DATA;
	const distributionData =
		!usingMock && summary?.actionDistribution?.length
			? summary.actionDistribution
			: MOCK_DISTRIBUTION_DATA;

	if (loadingLogs) return <LogsSkeleton />;

	const handleExport = async () => {
		if (exporting) return;
		setExporting(true);
		try {
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (tableFilter !== "All Tables") params.set("table", tableFilter);
			if (actionFilter !== "all") params.set("action", actionFilter);
			if (statusFilter !== "all") params.set("status", statusFilter);
			if (sourceFilter !== "all") params.set("source", sourceFilter);

			const res = await apiClient.get(`/api/logs/export?${params.toString()}`, {
				responseType: "blob",
			});

			const url = URL.createObjectURL(res.data as Blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch {
			// silently ignore — user stays on page
		} finally {
			setExporting(false);
		}
	};

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

	return (
		<section className="space-y-5 w-full">
			{/* ── Header ───────────────────────────────────────────────────── */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						System Logs
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Monitor system activity and track changes
					</p>
				</div>
				<button
					onClick={handleExport}
					disabled={exporting}
					className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors shadow-sm self-start sm:self-auto disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{exporting ? (
						<svg
							className="h-4 w-4 animate-spin"
							viewBox="0 0 24 24"
							fill="none"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
							/>
						</svg>
					) : (
						<Download className="h-4 w-4" />
					)}
					{exporting ? "Exporting…" : "Export Logs"}
				</button>
			</div>

			{/* ── Stats cards ──────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					icon={<Database className="w-4 h-4" />}
					iconBg="#dbeafe"
					iconColor="#2563eb"
					label="Total Logs"
					value={statsTotal}
					sub="All time"
				/>
				<StatCard
					icon={<CheckCircle className="h-5 w-5" />}
					iconBg="#dcfce7"
					iconColor="#16a34a"
					label="Success Rate"
					value={statsSuccessRate}
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
					value={statsFailedCount}
					sub="Requires attention"
					subColor="#ef4444"
				/>
				<StatCard
					icon={<Activity className="w-4 h-4" />}
					iconBg="#ede9fe"
					iconColor="#7c3aed"
					label="API Calls"
					value={statsApiCalls}
					sub="Last 7 days"
				/>
			</div>

			{/* ── Charts ───────────────────────────────────────────────────── */}
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
								{tableOptions.map((t) => (
									<DropdownMenuItem
										key={t}
										onClick={() => {
											setTable(t);
											setPage(1);
										}}
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
							data={activityData}
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
									data={distributionData}
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
						{distributionData.map((d, i) => (
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

			{/* ── Filters & Table ───────────────────────────────────────────── */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
				{/* Filter header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
					<h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
						Filters &amp; Search
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

				{/* Filter pills */}
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
							{loadingLogs && !usingMock ? (
								Array.from({ length: PAGE_SIZE }).map((_, i) => (
									<tr
										key={i}
										className="border-b border-slate-50 dark:border-slate-800/50 animate-pulse"
									>
										{Array.from({ length: 8 }).map((__, j) => (
											<td key={j} className="px-5 py-4">
												<div
													className="h-3 rounded bg-slate-100 dark:bg-slate-800"
													style={{ width: `${60 + ((j * 13) % 40)}%` }}
												/>
											</td>
										))}
									</tr>
								))
							) : paginated.length === 0 ? (
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
											{typeof log.timestamp === "string" &&
											log.timestamp.includes("T")
												? new Date(log.timestamp).toLocaleString()
												: log.timestamp}
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
													getActionStyle(log.action)
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
											) : log.status === "FAILED" ? (
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
											) : (
												<div>
													<div className="flex items-center gap-1.5">
														<Clock className="h-4 w-4 text-orange-400 shrink-0" />
														<span className="text-[12px] font-semibold text-orange-400">
															PENDING
														</span>
													</div>
													{/* {log.errorMsg && (
														<p className="text-[10px] text-red-400 mt-0.5 max-w-45">
															{log.errorMsg}
														</p>
													)} */}
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
							{displayTotal}
						</span>{" "}
						logs
						{usingMock && (
							<span className="ml-2 text-[11px] text-amber-500 font-medium">
								(preview data)
							</span>
						)}
					</p>
					<PaginationBar
						currentPage={page}
						totalPages={totalPages}
						totalItems={displayTotal}
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
