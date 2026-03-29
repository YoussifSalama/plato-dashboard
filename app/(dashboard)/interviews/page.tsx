"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Search,
	ChevronDown,
	Check,
	CalendarDays,
	Clock,
	Video,
	Calendar,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";
import { apiClient } from "@/lib/apiClient";
import PaginationBar from "@/shared/common/features/PaginationBar";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewStage =
	| "upcoming"
	| "in_person"
	| "offer"
	| "reschedule"
	| "in_screen";

type InterviewStatus = "scheduled" | "interview" | "completed" | "cancelled";

type Interview = {
	id: number;
	initials: string;
	avatarColor: string;
	name: string;
	position: string;
	date: string;
	time: string;
	duration: string;
	mode: "Video" | "In Person";
	stage: InterviewStage;
	status: InterviewStatus;
	rawDate: Date | null;
};

type ApiInterview = {
	id: number;
	candidate_name: string | null;
	role: string | null;
	scheduled_at: string | null;
	completed_at: string | null;
	duration_minutes: number | null;
	video_link: string | null;
	status: string;
	feedback: {
		agency: { decision: string | null; rating: number } | null;
		candidate: { decision: string | null; rating: number } | null;
	};
	created_at: string;
};

type ApiSummary = {
	not_scheduled: number;
	today: number;
	this_week: number;
	completed: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

const AVATAR_COLORS = [
	"bg-emerald-500",
	"bg-violet-500",
	"bg-teal-500",
	"bg-amber-500",
	"bg-blue-500",
	"bg-rose-500",
	"bg-indigo-500",
	"bg-cyan-500",
];

const STAGE_CONFIG: Record<
	InterviewStage,
	{ label: string; className: string }
> = {
	upcoming: { label: "Upcoming", className: "bg-emerald-500 text-white" },
	in_person: { label: "In Person", className: "bg-violet-500 text-white" },
	offer: { label: "Offer", className: "bg-teal-500 text-white" },
	reschedule: { label: "Reschedule", className: "bg-amber-400 text-white" },
	in_screen: { label: "In Screen", className: "bg-violet-500 text-white" },
};

const STATUS_CONFIG: Record<
	InterviewStatus,
	{ label: string; className: string }
> = {
	scheduled: { label: "Scheduled", className: "bg-emerald-500 text-white" },
	interview: { label: "Interview", className: "bg-[#005ca9] text-white" },
	completed: { label: "Completed", className: "bg-slate-500 text-white" },
	cancelled: { label: "Cancelled", className: "bg-rose-500 text-white" },
};

const STATUS_FILTER_OPTIONS = [
	{ label: "All Status", value: "all" },
	{ label: "Scheduled", value: "scheduled" },
	{ label: "Interview", value: "interview" },
	{ label: "Completed", value: "completed" },
	{ label: "Cancelled", value: "cancelled" },
] as const;

const STAGE_FILTER_OPTIONS = [
	{ label: "All Stages", value: "all" },
	{ label: "Upcoming", value: "upcoming" },
	{ label: "In Person", value: "in_person" },
	{ label: "Offer", value: "offer" },
	{ label: "Reschedule", value: "reschedule" },
	{ label: "In Screen", value: "in_screen" },
] as const;

const DATE_FILTER_OPTIONS = [
	{ label: "All Dates", value: "all" },
	{ label: "Today", value: "today" },
	{ label: "This Week", value: "week" },
	{ label: "This Month", value: "month" },
] as const;

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];
type StageFilter = (typeof STAGE_FILTER_OPTIONS)[number]["value"];
type DateFilter = (typeof DATE_FILTER_OPTIONS)[number]["value"];

// ─── Mock data (fallback when API returns no records) ─────────────────────────

const MOCK_INTERVIEWS: Interview[] = [
	{
		id: 1,
		initials: "SJ",
		avatarColor: "bg-emerald-500",
		name: "Sarah Johnson",
		position: "Senior Frontend Developer",
		date: "Feb 20, 2026",
		time: "10:00 AM",
		duration: "1 hour",
		mode: "Video",
		stage: "upcoming",
		status: "scheduled",
		rawDate: new Date("Feb 20, 2026"),
	},
	{
		id: 2,
		initials: "MC",
		avatarColor: "bg-violet-500",
		name: "Michael Chen",
		position: "Product Designer",
		date: "Feb 20, 2026",
		time: "2:00 PM",
		duration: "45 min",
		mode: "In Person",
		stage: "in_person",
		status: "scheduled",
		rawDate: new Date("Feb 20, 2026"),
	},
	{
		id: 3,
		initials: "ER",
		avatarColor: "bg-teal-500",
		name: "Emily Rodriguez",
		position: "Marketing Manager",
		date: "Feb 21, 2026",
		time: "11:00 AM",
		duration: "1 hour",
		mode: "Video",
		stage: "offer",
		status: "scheduled",
		rawDate: new Date("Feb 21, 2026"),
	},
	{
		id: 4,
		initials: "DK",
		avatarColor: "bg-amber-500",
		name: "David Kim",
		position: "Backend Engineer",
		date: "Feb 23, 2026",
		time: "3:00 PM",
		duration: "1 hour",
		mode: "Video",
		stage: "reschedule",
		status: "interview",
		rawDate: new Date("Feb 23, 2026"),
	},
	{
		id: 5,
		initials: "AM",
		avatarColor: "bg-violet-500",
		name: "Anna Martinez",
		position: "UX Designer",
		date: "Feb 22, 2026",
		time: "9:30 AM",
		duration: "45 min",
		mode: "Video",
		stage: "in_screen",
		status: "scheduled",
		rawDate: new Date("Feb 22, 2026"),
	},
];

const DEFAULT_SUMMARY: ApiSummary = {
	not_scheduled: 0,
	today: 0,
	this_week: 0,
	completed: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
	if (!name) return "??";
	return name
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function getAvatarColor(id: number): string {
	return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatTime(dateStr: string | null): string {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
}

function formatDuration(minutes: number | null): string {
	if (!minutes || minutes <= 0) return "—";
	if (minutes < 60) return `${minutes} min`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}

function deriveStage(s: ApiInterview): InterviewStage {
	if (s.feedback?.agency?.decision === "shortlist") return "offer";
	if (s.status === "in-screen") return "in_screen";
	if (s.feedback?.agency || s.feedback?.candidate) return "in_person";
	return "upcoming";
}

function deriveStatus(apiStatus: string): InterviewStatus {
	switch (apiStatus) {
		case "in-screen":
			return "interview";
		case "completed":
			return "completed";
		case "cancelled":
			return "cancelled";
		default:
			return "scheduled";
	}
}

function mapApiToInterview(s: ApiInterview): Interview {
	return {
		id: s.id,
		initials: getInitials(s.candidate_name),
		avatarColor: getAvatarColor(s.id),
		name: s.candidate_name ?? "Unknown Candidate",
		position: s.role ?? "—",
		date: formatDate(s.scheduled_at),
		time: formatTime(s.scheduled_at),
		duration: formatDuration(s.duration_minutes),
		mode: s.video_link ? "Video" : "In Person",
		stage: deriveStage(s),
		status: deriveStatus(s.status),
		rawDate: s.scheduled_at ? new Date(s.scheduled_at) : null,
	};
}

function isToday(date: Date): boolean {
	const now = new Date();
	return (
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate()
	);
}

function isThisWeek(date: Date): boolean {
	const now = new Date();
	const startOfWeek = new Date(now);
	const day = startOfWeek.getDay();
	startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
	startOfWeek.setHours(0, 0, 0, 0);
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(endOfWeek.getDate() + 6);
	endOfWeek.setHours(23, 59, 59, 999);
	return date >= startOfWeek && date <= endOfWeek;
}

function isThisMonth(date: Date): boolean {
	const now = new Date();
	return (
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth()
	);
}

// ─── Component ────────────────────────────────────────────────────────────────

const InterviewsPage = () => {
	const [interviews, setInterviews] = useState<Interview[]>([]);
	const [summary, setSummary] = useState<ApiSummary>(DEFAULT_SUMMARY);
	const [loading, setLoading] = useState(true);

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [stageFilter, setStageFilter] = useState<StageFilter>("all");
	const [dateFilter, setDateFilter] = useState<DateFilter>("all");
	const [page, setPage] = useState(1);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const [listRes, summaryRes] = await Promise.all([
				apiClient.get<{ data: { interviews: ApiInterview[]; total: number } }>(
					"/api/interview"
				),
				apiClient.get<{ data: ApiSummary }>("/api/interview?summary=1"),
			]);

			const apiInterviews = listRes.data.data.interviews;
			setInterviews(
				apiInterviews.length > 0
					? apiInterviews.map(mapApiToInterview)
					: MOCK_INTERVIEWS
			);
			setSummary(summaryRes.data.data);
		} catch {
			setInterviews(MOCK_INTERVIEWS);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Reset to page 1 whenever filters or search change
	useEffect(() => {
		setPage(1);
	}, [search, statusFilter, stageFilter, dateFilter]);

	const filtered = interviews.filter((i) => {
		const matchesSearch =
			!search ||
			i.name.toLowerCase().includes(search.toLowerCase()) ||
			i.position.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter === "all" || i.status === statusFilter;
		const matchesStage = stageFilter === "all" || i.stage === stageFilter;
		const matchesDate = (() => {
			if (dateFilter === "all" || !i.rawDate) return true;
			if (dateFilter === "today") return isToday(i.rawDate);
			if (dateFilter === "week") return isThisWeek(i.rawDate);
			if (dateFilter === "month") return isThisMonth(i.rawDate);
			return true;
		})();
		return matchesSearch && matchesStatus && matchesStage && matchesDate;
	});

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const pagedInterviews = filtered.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE
	);

	const statCards = [
		{
			label: "Not Scheduled",
			value: summary.not_scheduled,
			badge: "Today",
			bg: "bg-[#005CA9]",
		},
		{
			label: "Interviews Today",
			value: summary.today,
			badge: "Today",
			bg: "bg-[#905DF8]",
		},
		{
			label: "This Week",
			value: summary.this_week,
			badge: "Week",
			bg: "bg-[#F6AD55]",
		},
		{
			label: "Completed",
			value: summary.completed,
			badge: "Done",
			bg: "bg-[#48BB78]",
		},
	];

	return (
		<section className="space-y-6 mx-auto w-full">
			{/* Header */}
			<div className="px-2 mb-2">
				<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
					Interviews
				</h2>
				<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
					Schedule and manage candidate interviews
				</p>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-6">
				{statCards.map(({ label, value, badge, bg }) => (
					<div
						key={label}
						className={clsx(
							"relative flex flex-col justify-between rounded-3xl px-6 py-5 min-h-30",
							bg
						)}
					>
						<div className="flex items-start justify-between">
							<Calendar className="h-6 w-6 text-white" />
							<span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wide">
								{badge}
							</span>
						</div>
						<div className="mt-4 space-y-2">
							<p className="text-[13px] font-medium text-white/80">{label}</p>
							<p className="text-[30px] font-bold text-white leading-tight">
								{loading ? "—" : value}
							</p>
						</div>
					</div>
				))}
			</div>

			{/* Search + Filter bar */}
			<div className="rounded-[20px] bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950">
				<div className="flex items-center gap-3 px-5 py-3">
					<Search className="h-5 w-5 shrink-0 text-slate-400" />
					<input
						type="text"
						placeholder="Search by candidate name or position..."
						className="flex-1 bg-transparent text-[14px] font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal outline-none dark:text-slate-200"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>

					<FilterDropdown
						value={statusFilter}
						options={STATUS_FILTER_OPTIONS}
						onChange={(v) => setStatusFilter(v as StatusFilter)}
					/>
					<FilterDropdown
						value={stageFilter}
						options={STAGE_FILTER_OPTIONS}
						onChange={(v) => setStageFilter(v as StageFilter)}
					/>
					<FilterDropdown
						value={dateFilter}
						options={DATE_FILTER_OPTIONS}
						onChange={(v) => setDateFilter(v as DateFilter)}
					/>
				</div>
			</div>

			{/* Interview Cards */}
			<div className="flex flex-col gap-3">
				{loading ? (
					<div className="rounded-3xl bg-white border border-slate-100 px-6 py-10 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-950">
						Loading interviews...
					</div>
				) : pagedInterviews.length === 0 ? (
					<div className="rounded-3xl bg-white border border-slate-100 px-6 py-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-950">
						No interviews found.
					</div>
				) : (
					pagedInterviews.map((interview) => {
						const stageCfg = STAGE_CONFIG[interview.stage];
						const statusCfg = STATUS_CONFIG[interview.status];
						return (
							<div
								key={interview.id}
								className="flex items-center gap-5 rounded-3xl bg-white border border-slate-100 px-6 py-5 shadow-xs dark:border-slate-800 dark:bg-slate-950"
							>
								{/* Avatar */}
								<div
									className={clsx(
										"flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white",
										interview.avatarColor
									)}
								>
									{interview.initials}
								</div>

								{/* Name + Position + Date */}
								<div className="w-[220px] shrink-0">
									<p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
										{interview.name}
									</p>
									<p className="text-[12px] text-slate-400 mt-0.5 mb-2">
										{interview.position}
									</p>
									<div className="flex items-center gap-1.5 text-[12px] text-slate-400">
										<CalendarDays className="h-3.5 w-3.5 shrink-0" />
										<span>{interview.date}</span>
									</div>
								</div>

								{/* Time + Mode */}
								<div className="flex flex-1 items-center self-end gap-10">
									<div className="flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400">
										<Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										<span>
											{interview.time}{" "}
											<span className="text-slate-400">({interview.duration})</span>
										</span>
									</div>
									<div className="flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400">
										<Video className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										<span>{interview.mode}</span>
									</div>
								</div>

								{/* Stage + Status badges */}
								<div className="flex shrink-0 items-center gap-2">
									<span
										className={clsx(
											"inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide",
											stageCfg.className
										)}
									>
										{stageCfg.label}
									</span>
									<span
										className={clsx(
											"inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide",
											statusCfg.className
										)}
									>
										{statusCfg.label}
									</span>
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* Pagination */}
			{!loading && filtered.length > 0 && (
				<PaginationBar
					currentPage={safePage}
					totalPages={totalPages}
					onPageChange={setPage}
					totalItems={filtered.length}
					itemName="interviews"
					pageSize={PAGE_SIZE}
				/>
			)}
		</section>
	);
};

// ─── Shared filter dropdown ───────────────────────────────────────────────────

const FilterDropdown = ({
	value,
	options,
	onChange,
}: {
	value: string;
	options: readonly { label: string; value: string }[];
	onChange: (v: string) => void;
}) => {
	const current = options.find((o) => o.value === value);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div className="flex shrink-0 items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2 cursor-pointer hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
					<span className="text-[13px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
						{current?.label}
					</span>
					<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="rounded-[12px] p-2 dark:bg-slate-900 dark:border-slate-800"
			>
				{options.map((opt) => (
					<DropdownMenuItem
						key={opt.value}
						onClick={() => onChange(opt.value)}
						className="cursor-pointer rounded-[8px] flex items-center justify-between gap-6"
					>
						{opt.label}
						{value === opt.value && <Check className="h-4 w-4 text-blue-500" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default InterviewsPage;
