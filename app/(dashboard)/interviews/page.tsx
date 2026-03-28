"use client";

import { useState } from "react";
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
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<
	InterviewStage,
	{ label: string; className: string }
> = {
	upcoming: {
		label: "Upcoming",
		className: "bg-emerald-500 text-white",
	},
	in_person: {
		label: "In Person",
		className: "bg-violet-500 text-white",
	},
	offer: {
		label: "Offer",
		className: "bg-teal-500 text-white",
	},
	reschedule: {
		label: "Reschedule",
		className: "bg-amber-400 text-white",
	},
	in_screen: {
		label: "In Screen",
		className: "bg-violet-500 text-white",
	},
};

const STATUS_CONFIG: Record<
	InterviewStatus,
	{ label: string; className: string }
> = {
	scheduled: {
		label: "Scheduled",
		className: "bg-emerald-500 text-white",
	},
	interview: {
		label: "Interview",
		className: "bg-[#005ca9] text-white",
	},
	completed: {
		label: "Completed",
		className: "bg-slate-500 text-white",
	},
	cancelled: {
		label: "Cancelled",
		className: "bg-rose-500 text-white",
	},
};

const STAT_CARDS = [
	{
		label: "Not Scheduled",
		value: 12,
		badge: "Today",
		bg: "bg-[#005CA9]",
	},
	{
		label: "Interviews Today",
		value: 3,
		badge: "Today",
		bg: "bg-[#905DF8]",
	},
	{
		label: "This Week",
		value: 8,
		badge: "Week",
		bg: "bg-[#F6AD55]",
	},
	{
		label: "Completed",
		value: 47,
		badge: "Done",
		bg: "bg-[#48BB78]",
	},
];

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
	},
];

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

// ─── Component ────────────────────────────────────────────────────────────────

const InterviewsPage = () => {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [stageFilter, setStageFilter] = useState<StageFilter>("all");
	const [dateFilter, setDateFilter] = useState<DateFilter>("all");

	const filtered = MOCK_INTERVIEWS.filter((i) => {
		const matchesSearch =
			!search ||
			i.name.toLowerCase().includes(search.toLowerCase()) ||
			i.position.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter === "all" || i.status === statusFilter;
		const matchesStage = stageFilter === "all" || i.stage === stageFilter;
		return matchesSearch && matchesStatus && matchesStage;
	});

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
				{STAT_CARDS.map(({ label, value, badge, bg }) => (
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
								{value}
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

					{/* Status filter */}
					<FilterDropdown
						value={statusFilter}
						options={STATUS_FILTER_OPTIONS}
						onChange={(v) => setStatusFilter(v as StatusFilter)}
					/>

					{/* Stage filter */}
					<FilterDropdown
						value={stageFilter}
						options={STAGE_FILTER_OPTIONS}
						onChange={(v) => setStageFilter(v as StageFilter)}
					/>

					{/* Date filter */}
					<FilterDropdown
						value={dateFilter}
						options={DATE_FILTER_OPTIONS}
						onChange={(v) => setDateFilter(v as DateFilter)}
					/>
				</div>
			</div>

			{/* Interview Cards */}
			<div className="flex flex-col gap-3">
				{filtered.length === 0 ? (
					<div className="rounded-3xl bg-white border border-slate-100 px-6 py-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-950">
						No interviews found.
					</div>
				) : (
					filtered.map((interview) => {
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
											<span className="text-slate-400">
												({interview.duration})
											</span>
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
