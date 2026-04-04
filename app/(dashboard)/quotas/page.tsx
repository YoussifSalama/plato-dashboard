"use client";

import { useState } from "react";
import {
	Briefcase,
	Users,
	MessageSquare,
	FileDown,
	Search,
	X,
	RotateCcw,
	SlidersHorizontal,
	Plus,
	ChevronDown,
} from "lucide-react";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuotaLimits = {
	jobPosts: number | null;
	candidates: number | null;
	messages: number | null;
	downloads: number | null;
};

type Company = {
	id: number;
	name: string;
	plan: "Pro" | "Enterprise" | "Basic";
	usage: {
		jobPosts: number;
		candidates: number;
		messages: number;
		downloads: number;
	};
	limits: QuotaLimits;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_COMPANIES: Company[] = [
	{
		id: 1,
		name: "Acme Corp",
		plan: "Pro",
		usage: { jobPosts: 18, candidates: 125000, messages: 4651200, downloads: 40150 },
		limits: { jobPosts: 50, candidates: null, messages: null, downloads: null },
	},
	{
		id: 2,
		name: "Tech Solutions",
		plan: "Enterprise",
		usage: { jobPosts: 45, candidates: 587, messages: 2340, downloads: 340 },
		limits: { jobPosts: null, candidates: null, messages: null, downloads: null },
	},
	{
		id: 3,
		name: "Global Industries",
		plan: "Pro",
		usage: { jobPosts: 8, candidates: 67900, messages: 3245100, downloads: 42150 },
		limits: { jobPosts: 100, candidates: null, messages: null, downloads: null },
	},
	{
		id: 4,
		name: "Startup Inc",
		plan: "Basic",
		usage: { jobPosts: 5, candidates: 23500, messages: 145900, downloads: 12180 },
		limits: { jobPosts: 10, candidates: null, messages: null, downloads: null },
	},
];

const PLATFORM_STATS = [
	{
		label: "Job Posting Quota",
		used: 342,
		total: 500,
		pct: 68,
		color: "#3b82f6",
		trackColor: "#dbeafe",
		icon: Briefcase,
	},
	{
		label: "Candidate Views",
		used: 2024,
		total: 5000,
		pct: 45,
		color: "#8b5cf6",
		trackColor: "#ede9fe",
		icon: Users,
	},
	{
		label: "Message Quota",
		used: 7824,
		total: 10000,
		pct: 78,
		color: "#f97316",
		trackColor: "#ffedd5",
		icon: MessageSquare,
	},
	{
		label: "CV Downloads",
		used: 1560,
		total: 3000,
		pct: 52,
		color: "#22c55e",
		trackColor: "#dcfce7",
		icon: FileDown,
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtNum = (n: number) =>
	n >= 1_000_000
		? `${(n / 1_000_000).toFixed(1)}m`
		: n >= 1_000
			? `${(n / 1_000).toFixed(0)}k`
			: String(n);

const pct = (used: number, limit: number | null) =>
	limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

const pctColor = (p: number) =>
	p >= 90 ? "#ef4444" : p >= 70 ? "#f97316" : "#22c55e";

const PLAN_STYLES: Record<Company["plan"], string> = {
	Pro: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
	Enterprise: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
	Basic: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// ─── Circular Progress ────────────────────────────────────────────────────────

const CircleProgress = ({
	pct,
	color,
	trackColor,
	size = 56,
}: {
	pct: number;
	color: string;
	trackColor: string;
	size?: number;
}) => {
	const r = (size - 6) / 2;
	const circ = 2 * Math.PI * r;
	const offset = circ - (pct / 100) * circ;
	return (
		<svg width={size} height={size} className="-rotate-90">
			<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={5} />
			<circle
				cx={size / 2}
				cy={size / 2}
				r={r}
				fill="none"
				stroke={color}
				strokeWidth={5}
				strokeDasharray={circ}
				strokeDashoffset={offset}
				strokeLinecap="round"
			/>
		</svg>
	);
};

// ─── Mini Bar ─────────────────────────────────────────────────────────────────

const MiniBar = ({ pct: p, color }: { pct: number; color: string }) => (
	<div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
		<div
			className="h-full rounded-full transition-all"
			style={{ width: `${p}%`, backgroundColor: color }}
		/>
	</div>
);

// ─── Adjust Limits Modal ──────────────────────────────────────────────────────

type ModalProps = {
	company: Company;
	onClose: () => void;
	onSave: (id: number, limits: QuotaLimits, resetUsage: boolean) => void;
};

const AdjustModal = ({ company, onClose, onSave }: ModalProps) => {
	const [limits, setLimits] = useState<{ [K in keyof QuotaLimits]: string }>({
		jobPosts: company.limits.jobPosts === null ? "" : String(company.limits.jobPosts),
		candidates: company.limits.candidates === null ? "" : String(company.limits.candidates),
		messages: company.limits.messages === null ? "" : String(company.limits.messages),
		downloads: company.limits.downloads === null ? "" : String(company.limits.downloads),
	});
	const [resetUsage, setResetUsage] = useState(false);

	const setUnlimited = (key: keyof QuotaLimits) =>
		setLimits((prev) => ({ ...prev, [key]: "" }));

	const handleSave = () => {
		onSave(
			company.id,
			{
				jobPosts: limits.jobPosts ? parseInt(limits.jobPosts) : null,
				candidates: limits.candidates ? parseInt(limits.candidates) : null,
				messages: limits.messages ? parseInt(limits.messages) : null,
				downloads: limits.downloads ? parseInt(limits.downloads) : null,
			},
			resetUsage
		);
	};

	const fields: { key: keyof QuotaLimits; label: string }[] = [
		{ key: "jobPosts", label: "Job Posts Limit" },
		{ key: "candidates", label: "Candidate Views Limit" },
		{ key: "messages", label: "Messages Limit" },
		{ key: "downloads", label: "CV Downloads Limit" },
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800 mx-4">
				{/* Header */}
				<div className="flex items-start justify-between px-6 pt-6 pb-4">
					<div>
						<h2 className="text-[17px] font-bold text-slate-900 dark:text-slate-50">
							Adjust Quota Limits
						</h2>
						<p className="text-[12px] text-slate-400 mt-0.5">
							{company.name} &middot; {company.plan}
						</p>
					</div>
					<button
						onClick={onClose}
						className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="px-6 pb-6 space-y-4">
					{fields.map(({ key, label }) => (
						<div key={key}>
							<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
								{label}
							</label>
							<div className="mt-1.5 flex items-center gap-2">
								<input
									type="number"
									placeholder="Unlimited"
									value={limits[key]}
									onChange={(e) =>
										setLimits((prev) => ({ ...prev, [key]: e.target.value }))
									}
									className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
								/>
								<button
									onClick={() => setUnlimited(key)}
									className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] font-semibold text-emerald-600 transition-colors hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
								>
									Unlimited
								</button>
							</div>
						</div>
					))}

					{/* Reset checkbox */}
					<label className="flex items-center gap-2.5 cursor-pointer pt-1">
						<input
							type="checkbox"
							checked={resetUsage}
							onChange={(e) => setResetUsage(e.target.checked)}
							className="h-4 w-4 rounded border-slate-300 accent-blue-500"
						/>
						<span className="text-[13px] text-slate-500 dark:text-slate-400">
							Reset current usage to 0 when applying new limits
						</span>
					</label>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-2">
						<button
							onClick={onClose}
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="rounded-xl bg-[#005ca9] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors"
						>
							Save Changes
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Add Credits Modal ────────────────────────────────────────────────────────

const CREDIT_TYPES = [
	{ label: "Job Posts", value: "jobPosts" },
	{ label: "Candidate Views", value: "candidates" },
	{ label: "Messages", value: "messages" },
	{ label: "CV Downloads", value: "downloads" },
];

const AddCreditsModal = ({
	company,
	onClose,
}: {
	company: Company;
	onClose: () => void;
}) => {
	const [creditType, setCreditType] = useState("");
	const [amount, setAmount] = useState("");
	const [typeOpen, setTypeOpen] = useState(false);

	const selectedType = CREDIT_TYPES.find((t) => t.value === creditType);

	const quickAdd = (n: number) =>
		setAmount((prev) => String((parseInt(prev) || 0) + n));

	const canSubmit = creditType && parseInt(amount) > 0;

	const usageRows = [
		{ label: "Job Posts", used: company.usage.jobPosts, limit: company.limits.jobPosts },
		{ label: "Profile Views", used: company.usage.candidates, limit: company.limits.candidates },
		{ label: "Messages", used: company.usage.messages, limit: company.limits.messages },
		{ label: "Downloads", used: company.usage.downloads, limit: company.limits.downloads },
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800 mx-4">
				{/* Header */}
				<div className="flex items-start justify-between px-6 pt-6 pb-4">
					<div>
						<h2 className="text-[17px] font-bold text-slate-900 dark:text-slate-50">
							Add Credits
						</h2>
						<p className="text-[12px] text-slate-400 mt-0.5">
							{company.name} &middot; {company.plan}
						</p>
					</div>
					<button
						onClick={onClose}
						className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="px-6 pb-6 space-y-4">
					{/* Current Usage */}
					<div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
						<p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
							Current Usage
						</p>
						<div className="grid grid-cols-2 gap-3">
							{usageRows.map((row) => (
								<div key={row.label}>
									<p className="text-[10px] text-slate-400 mb-0.5">{row.label}</p>
									<p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
										{fmtNum(row.used)}/{row.limit ? fmtNum(row.limit) : "∞"}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Credit Type */}
					<div className="relative">
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Credit Type
						</label>
						<button
							type="button"
							onClick={() => setTypeOpen((p) => !p)}
							className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-left outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800"
						>
							<span className={creditType ? "text-slate-800 dark:text-slate-100" : "text-slate-300"}>
								{selectedType?.label ?? "Select credit type"}
							</span>
							<ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
						</button>
						{typeOpen && (
							<div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-100 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
								{CREDIT_TYPES.map((t) => (
									<button
										key={t.value}
										type="button"
										onClick={() => { setCreditType(t.value); setTypeOpen(false); }}
										className={clsx(
											"w-full px-3 py-2.5 text-left text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
											creditType === t.value
												? "font-semibold text-[#005ca9]"
												: "text-slate-700 dark:text-slate-200"
										)}
									>
										{t.label}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Credit Amount */}
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Credit Amount
						</label>
						<input
							type="number"
							min={1}
							placeholder="Enter credit amount to add"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
						/>
						<p className="mt-1 text-[11px] text-slate-400">
							This will add extra credits to the user&apos;s current limit
						</p>
					</div>

					{/* Quick Add */}
					<div>
						<p className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
							Quick Add
						</p>
						<div className="grid grid-cols-4 gap-2">
							{[5, 10, 25, 50].map((n) => (
								<button
									key={n}
									type="button"
									onClick={() => quickAdd(n)}
									className="rounded-xl border border-slate-200 bg-white py-2 text-[13px] font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#005ca9] transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
								>
									+{n}
								</button>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-1">
						<button
							onClick={onClose}
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
						>
							Cancel
						</button>
						<button
							disabled={!canSubmit}
							onClick={onClose}
							className="inline-flex items-center gap-1.5 rounded-xl bg-[#005ca9] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<Plus className="h-3.5 w-3.5" />
							Add Credits
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabKey = "company" | "candidate";

const QuotasPage = () => {
	const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
	const [adjusting, setAdjusting] = useState<Company | null>(null);
	const [addingCredits, setAddingCredits] = useState<Company | null>(null);
	const [activeTab, setActiveTab] = useState<TabKey>("company");
	const [search, setSearch] = useState("");

	const filtered = companies.filter((c) =>
		c.name.toLowerCase().includes(search.toLowerCase())
	);

	const handleSave = (id: number, limits: QuotaLimits, resetUsage: boolean) => {
		setCompanies((prev) =>
			prev.map((c) => {
				if (c.id !== id) return c;
				return {
					...c,
					limits,
					usage: resetUsage
						? { jobPosts: 0, candidates: 0, messages: 0, downloads: 0 }
						: c.usage,
				};
			})
		);
		setAdjusting(null);
	};

	const handleResetUsage = (id: number) => {
		setCompanies((prev) =>
			prev.map((c) =>
				c.id === id
					? { ...c, usage: { jobPosts: 0, candidates: 0, messages: 0, downloads: 0 } }
					: c
			)
		);
	};

	// Quota cell component (inline)
	const QuotaCell = ({
		used,
		limit,
	}: {
		used: number;
		limit: number | null;
	}) => {
		const p = pct(used, limit);
		const color = limit ? pctColor(p) : "#94a3b8";
		return (
			<div className="flex flex-col gap-1 min-w-22.5">
				<div className="flex items-center gap-1.5">
					<span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
						{fmtNum(used)}/{limit ? fmtNum(limit) : "∞"}
					</span>
					{limit && (
						<span className="text-[10px] font-bold" style={{ color }}>
							{p}%
						</span>
					)}
				</div>
				<MiniBar pct={limit ? p : 0} color={color} />
			</div>
		);
	};

	return (
		<section className="space-y-6 w-full">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						Quotas & Limits
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Monitor and manage user quotas across the platform
					</p>
				</div>
				<button className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors shadow-sm self-start sm:self-auto">
					<SlidersHorizontal className="h-4 w-4" />
					Bulk Update Quotas
				</button>
			</div>

			{/* Platform-Wide Usage */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-6">
				<h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-200 mb-5">
					Platform-Wide Usage
				</h3>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{PLATFORM_STATS.map((stat) => {
						const Icon = stat.icon;
						return (
							<div
								key={stat.label}
								className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900"
							>
								<div className="flex items-center justify-between">
									{/* Circle progress */}
									<div className="relative flex items-center justify-center">
										<CircleProgress
											pct={stat.pct}
											color={stat.color}
											trackColor={stat.trackColor}
										/>
										<div className="absolute flex items-center justify-center">
											<Icon className="h-4 w-4" style={{ color: stat.color }} />
										</div>
									</div>
									<span
										className="text-[20px] font-bold"
										style={{ color: stat.color }}
									>
										{stat.pct}%
									</span>
								</div>
								<div>
									<p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
										{stat.label}
									</p>
									<p className="text-[11px] text-slate-400 mt-0.5">
										{fmtNum(stat.used)} / {fmtNum(stat.total)}
									</p>
								</div>
								<MiniBar pct={stat.pct} color={stat.color} />
							</div>
						);
					})}
				</div>
			</div>

			{/* Tabs + Table */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
				{/* Tabs */}
				<div className="flex border-b border-slate-100 dark:border-slate-800">
					{(["company", "candidate"] as TabKey[]).map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={clsx(
								"px-6 py-4 text-[13px] font-semibold transition-colors border-b-2 -mb-px",
								activeTab === tab
									? "border-[#005ca9] text-[#005ca9]"
									: "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
							)}
						>
							{tab === "company" ? "Company Quotas" : "Candidate Quotas"}
						</button>
					))}
				</div>

				{activeTab === "company" && (
					<div className="p-5">
						{/* Search + section title */}
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
								Company Quotas
							</h3>
							<div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 w-52">
								<Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search companies..."
									className="w-full bg-transparent text-[12px] text-slate-600 placeholder:text-slate-400 outline-none dark:text-slate-300"
								/>
							</div>
						</div>

						{/* Table */}
						<div className="overflow-x-auto">
							<table className="w-full min-w-205">
								<thead>
									<tr className="border-b border-slate-100 dark:border-slate-800">
										{[
											"COMPANY",
											"PLAN",
											"JOB POSTS",
											"CANDIDATES",
											"MESSAGES",
											"DOWNLOADS",
											"ACTIONS",
										].map((h) => (
											<th
												key={h}
												className="pb-3 pt-1 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase"
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{filtered.length === 0 ? (
										<tr>
											<td
												colSpan={7}
												className="py-12 text-center text-[13px] text-slate-400"
											>
												No companies found.
											</td>
										</tr>
									) : (
										filtered.map((c) => (
											<tr
												key={c.id}
												className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
											>
												{/* Company */}
												<td className="py-4 text-[13px] font-semibold text-slate-800 dark:text-slate-100 pr-4">
													{c.name}
												</td>

												{/* Plan badge */}
												<td className="py-4 pr-4">
													<span
														className={clsx(
															"inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
															PLAN_STYLES[c.plan]
														)}
													>
														{c.plan}
													</span>
												</td>

												{/* Job Posts */}
												<td className="py-4 pr-6">
													<QuotaCell
														used={c.usage.jobPosts}
														limit={c.limits.jobPosts}
													/>
												</td>

												{/* Candidates */}
												<td className="py-4 pr-6">
													<QuotaCell
														used={c.usage.candidates}
														limit={c.limits.candidates}
													/>
												</td>

												{/* Messages */}
												<td className="py-4 pr-6">
													<QuotaCell
														used={c.usage.messages}
														limit={c.limits.messages}
													/>
												</td>

												{/* Downloads */}
												<td className="py-4 pr-6">
													<QuotaCell
														used={c.usage.downloads}
														limit={c.limits.downloads}
													/>
												</td>

												{/* Actions */}
												<td className="py-4">
													<div className="flex items-center gap-2">
														<button
															onClick={() => setAddingCredits(c)}
															className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-emerald-200 hover:text-emerald-600 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400 whitespace-nowrap"
														>
															<Plus className="h-3 w-3" />
															Add Credits
														</button>
														<button
															onClick={() => setAdjusting(c)}
															className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-blue-200 hover:text-[#005ca9] transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-blue-400 whitespace-nowrap"
														>
															<SlidersHorizontal className="h-3 w-3" />
															Adjust Limits
														</button>
														<button
															onClick={() => handleResetUsage(c.id)}
															className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-rose-500 transition-colors whitespace-nowrap"
														>
															<RotateCcw className="h-3 w-3" />
															Reset Usage
														</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{activeTab === "candidate" && (
					<div className="flex flex-col items-center justify-center py-20 text-slate-400">
						<Users className="h-10 w-10 mb-3 opacity-30" />
						<p className="text-[14px] font-medium">Candidate quotas coming soon</p>
					</div>
				)}
			</div>

			{/* Modals */}
			{adjusting && (
				<AdjustModal
					company={adjusting}
					onClose={() => setAdjusting(null)}
					onSave={handleSave}
				/>
			)}
			{addingCredits && (
				<AddCreditsModal
					company={addingCredits}
					onClose={() => setAddingCredits(null)}
				/>
			)}
		</section>
	);
};

export default QuotasPage;
