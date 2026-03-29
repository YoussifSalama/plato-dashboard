"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Search,
	Filter,
	ChevronDown,
	Check,
	Star,
	Mail,
	Phone,
	MapPin,
	Clock,
	TrendingUp,
	TrendingDown,
	Users,
	ClipboardCheck,
	Calendar,
	CircleCheck,
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
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type CandidateStatus =
	| "shortlisted"
	| "active"
	| "offer"
	| "interview"
	| "rejected";

type Candidate = {
	id: number;
	applicationId: number;
	profileId: number | null;
	initials: string;
	avatarColor: string;
	name: string;
	position: string;
	email: string;
	phone: string;
	location: string;
	appliedAgo: string;
	rating: number | null;
	status: CandidateStatus;
	resumeId: number;
};

type ApiApplication = {
	application_id: number;
	candidate_id: number;
	profile_id: number | null;
	candidate_name: string;
	candidate_email: string | null;
	candidate_phone: string | null;
	candidate_title: string | null;
	candidate_location: string | null;
	applied_ago: string;
	score_out_of_5: number | null;
	status: string;
	resumeId: number;
};

type ApiSummary = {
	total: number;
	in_review: number;
	interviewed: number;
	got_offer: number;
	diff: {
		total: string;
		in_review: string;
		interviewed: string;
		got_offer: string;
	};
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

const STATUS_CONFIG: Record<
	CandidateStatus,
	{ label: string; className: string }
> = {
	shortlisted: { label: "Shortlisted", className: "bg-teal-500 text-white" },
	active: { label: "Active", className: "bg-emerald-500 text-white" },
	offer: { label: "Offer", className: "bg-orange-400 text-white" },
	interview: { label: "Interview", className: "bg-amber-400 text-white" },
	rejected: { label: "Rejected", className: "bg-rose-500 text-white" },
};

const STATUS_FILTER_OPTIONS = [
	{ label: "All Status", value: "all" },
	{ label: "Shortlisted", value: "shortlisted" },
	{ label: "Active", value: "active" },
	{ label: "Offer", value: "offer" },
	{ label: "Interview", value: "interview" },
	{ label: "Rejected", value: "rejected" },
] as const;

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

// ─── Mock data (fallback when API returns no records) ─────────────────────────

const MOCK_CANDIDATES: Candidate[] = [
	{
		id: 1,
		applicationId: 1,
		profileId: null,
		initials: "SJ",
		avatarColor: "bg-emerald-500",
		name: "Sarah Johnson",
		position: "Senior Frontend Developer",
		email: "sarah.j@email.com",
		phone: "+1 (555) 123-4567",
		location: "San Francisco, CA",
		appliedAgo: "Applied 2 days ago",
		rating: 4.5,
		status: "shortlisted",
		resumeId: 1,
	},
	{
		id: 2,
		applicationId: 2,
		profileId: null,
		initials: "MC",
		avatarColor: "bg-violet-500",
		name: "Michael Chen",
		position: "Product Designer",
		email: "michael.chen@email.com",
		phone: "+1 (555) 234-5678",
		location: "New York, NY",
		appliedAgo: "Applied 1 day ago",
		rating: 4.8,
		status: "active",
		resumeId: 2,
	},
	{
		id: 3,
		applicationId: 3,
		profileId: null,
		initials: "ER",
		avatarColor: "bg-teal-500",
		name: "Emily Rodriguez",
		position: "Marketing Manager",
		email: "emily.rodriguez@email.com",
		phone: "+1 (555) 345-6789",
		location: "Austin, TX",
		appliedAgo: "Applied 3 days ago",
		rating: 4.7,
		status: "offer",
		resumeId: 3,
	},
	{
		id: 4,
		applicationId: 4,
		profileId: null,
		initials: "DK",
		avatarColor: "bg-amber-500",
		name: "David Kim",
		position: "Backend Engineer",
		email: "david.kim@email.com",
		phone: "+1 (555) 456-7890",
		location: "Seattle, WA",
		appliedAgo: "Applied 5 days ago",
		rating: 4.3,
		status: "interview",
		resumeId: 4,
	},
	{
		id: 5,
		applicationId: 5,
		profileId: null,
		initials: "JT",
		avatarColor: "bg-rose-500",
		name: "Jessica Taylor",
		position: "Senior Frontend Developer",
		email: "jessica@email.com",
		phone: "+1 (555) 567-8901",
		location: "Remote",
		appliedAgo: "Applied 1 week ago",
		rating: 3.9,
		status: "rejected",
		resumeId: 5,
	},
];

const DEFAULT_SUMMARY: ApiSummary = {
	total: 0,
	in_review: 0,
	interviewed: 0,
	got_offer: 0,
	diff: { total: "+0", in_review: "+0", interviewed: "+0", got_offer: "+0" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
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

function mapApiStatus(apiStatus: string): CandidateStatus {
	switch (apiStatus) {
		case "shortlisted":
			return "shortlisted";
		case "in_interview":
			return "interview";
		case "offer":
			return "offer";
		case "rejected":
			return "rejected";
		default:
			// "active" and "in_review" both map to active
			return "active";
	}
}

function mapApiToCandidate(app: ApiApplication): Candidate {
	return {
		id: app.candidate_id,
		applicationId: app.application_id,
		profileId: app.profile_id,
		initials: getInitials(app.candidate_name),
		avatarColor: getAvatarColor(app.candidate_id),
		name: app.candidate_name,
		position: app.candidate_title ?? "—",
		email: app.candidate_email ?? "—",
		phone: app.candidate_phone ?? "—",
		location: app.candidate_location ?? "—",
		appliedAgo: `Applied ${app.applied_ago}`,
		rating: app.score_out_of_5,
		status: mapApiStatus(app.status),
		resumeId: app.resumeId,
	};
}

// ─── Component ────────────────────────────────────────────────────────────────

const CandidatesPage = () => {
	const [candidates, setCandidates] = useState<Candidate[]>([]);
	const [summary, setSummary] = useState<ApiSummary>(DEFAULT_SUMMARY);
	const [loading, setLoading] = useState(true);
	const [usingMock, setUsingMock] = useState(false);

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [page, setPage] = useState(1);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const [listRes, summaryRes] = await Promise.all([
				apiClient.get<{
					data: { applications: ApiApplication[]; total: number };
				}>("/api/candidate"),
				apiClient.get<{ data: ApiSummary }>("/api/candidate?summary=1"),
			]);

			const apiApplications = listRes.data.data.applications;
			const apiSummary = summaryRes.data.data;

			if (apiApplications.length === 0) {
				setCandidates(MOCK_CANDIDATES);
				setSummary(DEFAULT_SUMMARY);
				setUsingMock(true);
			} else {
				setCandidates(apiApplications.map(mapApiToCandidate));
				setSummary(apiSummary);
				setUsingMock(false);
			}
		} catch {
			setCandidates(MOCK_CANDIDATES);
			setSummary(DEFAULT_SUMMARY);
			setUsingMock(true);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Reset page on filter/search change
	useEffect(() => {
		setPage(1);
	}, [search, statusFilter]);

	const filtered = candidates.filter((c) => {
		const matchesSearch =
			!search ||
			c.name.toLowerCase().includes(search.toLowerCase()) ||
			c.position.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter === "all" || c.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const paged = filtered.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE
	);

	const statCards = [
		{
			label: "Total Candidates",
			value: usingMock ? 156 : summary.total,
			trend: usingMock ? "+16.6%" : summary.diff.total,
			trendUp: usingMock ? true : !summary.diff.total.startsWith("-"),
			icon: <Users className="h-5 w-5 text-[#48BB78]" />,
			iconBg: "bg-[#48BB7833]",
		},
		{
			label: "In Review",
			value: usingMock ? 42 : summary.in_review,
			trend: usingMock ? "+85" : summary.diff.in_review,
			trendUp: usingMock ? true : !summary.diff.in_review.startsWith("-"),
			icon: <ClipboardCheck className="h-5 w-5 text-[#905DF8]" />,
			iconBg: "bg-[#905DF833]",
		},
		{
			label: "Interviewed",
			value: usingMock ? 28 : summary.interviewed,
			trend: usingMock ? "-3" : summary.diff.interviewed,
			trendUp: usingMock ? false : !summary.diff.interviewed.startsWith("-"),
			icon: <Calendar className="h-5 w-5 text-[#F6AD55]" />,
			iconBg: "bg-[#F6AD5533]",
		},
		{
			label: "Offers Sent",
			value: usingMock ? 12 : summary.got_offer,
			trend: usingMock ? "+163" : summary.diff.got_offer,
			trendUp: usingMock ? true : !summary.diff.got_offer.startsWith("-"),
			icon: <CircleCheck className="h-5 w-5 text-teal-600" />,
			iconBg: "bg-[#48BB7833]",
		},
	];

	return (
		<section className="space-y-6 mx-auto w-full">
			{/* Header */}
			<div className="px-2 mb-2">
				<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
					Candidates
				</h2>
				<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
					Review and manage candidate applications
				</p>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{statCards.map(({ label, value, trend, trendUp, icon, iconBg }) => (
					<div
						key={label}
						className="relative flex flex-col gap-3 rounded-[16px] bg-white border border-slate-100 px-5 py-5 shadow-xs dark:border-slate-800 dark:bg-slate-950"
					>
						<div className="flex items-start justify-between">
							<span
								className={clsx(
									"flex h-10 w-10 items-center justify-center rounded-[10px]",
									iconBg
								)}
							>
								{icon}
							</span>
							<span
								className={clsx(
									"flex items-center gap-1 text-[11px] font-semibold",
									trendUp ? "text-emerald-500" : "text-rose-500"
								)}
							>
								{trendUp ? (
									<TrendingUp className="h-3 w-3" />
								) : (
									<TrendingDown className="h-3 w-3" />
								)}
								{trend}
							</span>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-[12px] font-medium text-slate-400">
								{label}
							</span>
							<span className="text-[26px] font-bold text-[#2D3748] leading-tight dark:text-slate-100">
								{loading ? "—" : value}
							</span>
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
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex shrink-0 items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2 cursor-pointer hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
								<span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
									{STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)
										?.label ?? "All Status"}
								</span>
								<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[160px] rounded-[12px] p-2 dark:bg-slate-900 dark:border-slate-800"
						>
							{STATUS_FILTER_OPTIONS.map((opt) => (
								<DropdownMenuItem
									key={opt.value}
									onClick={() => setStatusFilter(opt.value)}
									className="cursor-pointer rounded-[8px] flex items-center justify-between"
								>
									{opt.label}
									{statusFilter === opt.value && (
										<Check className="h-4 w-4 text-blue-500" />
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900">
						<Filter className="h-4 w-4 stroke-[2]" />
					</div>
				</div>
			</div>

			{/* Candidate Cards */}
			<div className="flex flex-col gap-3">
				{loading ? (
					<div className="rounded-[16px] bg-white border border-slate-100 px-6 py-10 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-950">
						Loading candidates...
					</div>
				) : paged.length === 0 ? (
					<div className="rounded-[16px] bg-white border border-slate-100 px-6 py-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-950">
						No candidates found.
					</div>
				) : (
					paged.map((candidate) => {
						const statusCfg = STATUS_CONFIG[candidate.status];
						return (
							<div
								key={`${candidate.id}-${candidate.applicationId}`}
								className="flex items-center gap-5 rounded-[16px] bg-white border border-slate-100 px-6 py-6 shadow-xs dark:border-slate-800 dark:bg-slate-950"
							>
								{/* Avatar */}
								<div
									className={clsx(
										"flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white",
										candidate.avatarColor
									)}
								>
									{candidate.initials}
								</div>

								{/* Name + Position */}
								<div className="w-[200px] shrink-0 flex flex-col gap-2">
									<p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
										{candidate.name}
									</p>
									<p className="text-[12px] text-slate-400 mt-0.5">
										{candidate.position}
									</p>
									<div className="flex items-center gap-2 text-[12px] text-slate-400 dark:text-slate-400">
										<Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										<span className="truncate">{candidate.email}</span>
									</div>
									<div className="flex items-center gap-2 text-[12px] text-slate-400 dark:text-slate-400">
										<Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										<span>{candidate.appliedAgo}</span>
									</div>
								</div>

								{/* Details grid */}
								<div className="ml-18 flex-1 grid grid-cols-2 gap-x-8 gap-y-1.5">
									<div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
										<Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										<span>{candidate.phone}</span>
									</div>
									<div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
										<MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										<span>{candidate.location}</span>
									</div>
								</div>

								{/* Right: rating + status + button */}
								<div className="self-start flex flex-col shrink-0 gap-6">
									<div className="flex items-center gap-x-2">
										<div className="flex items-center gap-1.5">
											<Star
												className={clsx(
													"h-4 w-4",
													candidate.rating != null
														? "fill-amber-400 text-amber-400"
														: "text-slate-300 dark:text-slate-600"
												)}
											/>
											<span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
												{candidate.rating != null
													? candidate.rating.toFixed(1)
													: "—"}
											</span>
										</div>
										<span
											className={clsx(
												"inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide",
												statusCfg.className
											)}
										>
											{statusCfg.label}
										</span>
									</div>
									<Link
										href={`/candidates/${candidate.resumeId}`}
										className="inline-flex items-center justify-center rounded-[10px] bg-[#005CA9] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#2D3748] transition-colors"
									>
										View Profile
									</Link>
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
					itemName="candidates"
					pageSize={PAGE_SIZE}
				/>
			)}
		</section>
	);
};

export default CandidatesPage;
