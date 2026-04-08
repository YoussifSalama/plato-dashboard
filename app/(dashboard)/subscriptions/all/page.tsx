"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Search,
	ChevronDown,
	Check,
	Loader2,
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
import { errorToast } from "@/shared/helper/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxStatus = "Completed" | "Pending" | "Failed" | "Refunded";

type Transaction = {
	id: number;
	company: string;
	plan: string;
	amount: string;
	date: string;
	status: TxStatus;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: TxStatus | "all" }[] = [
	{ label: "All Status", value: "all" },
	{ label: "Completed", value: "Completed" },
	{ label: "Pending", value: "Pending" },
	{ label: "Failed", value: "Failed" },
	{ label: "Refunded", value: "Refunded" },
];

const PLAN_OPTIONS = [
	{ label: "All Plans", value: "all" },
	{ label: "STARTER", value: "STARTER" },
	{ label: "GROWTH", value: "GROWTH" },
	{ label: "PRO", value: "PRO" },
	{ label: "EXTRA", value: "EXTRA" },
	{ label: "CUSTOM", value: "CUSTOM" },
];

const STATUS_STYLES: Record<TxStatus, string> = {
	Completed: "bg-emerald-500 text-white",
	Pending: "bg-amber-400 text-white",
	Failed: "bg-red-500 text-white",
	Refunded: "bg-slate-400 text-white",
};

const PAGE_SIZE = 8;

// ─── Row Skeleton ─────────────────────────────────────────────────────────────

const RowSkeleton = () => (
	<tr className="border-b border-slate-50 dark:border-slate-800/50">
		{[160, 80, 70, 100, 70].map((w, i) => (
			<td key={i} className="px-6 py-4">
				<div
					className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
					style={{ width: w }}
				/>
			</td>
		))}
	</tr>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const AllTransactionsPage = () => {
	const router = useRouter();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatus] = useState<TxStatus | "all">("all");
	const [planFilter, setPlan] = useState("all");
	const [page, setPage] = useState(1);

	const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const loadTransactions = useCallback(
		async (opts: {
			page: number;
			search: string;
			status: TxStatus | "all";
			plan: string;
		}) => {
			setLoading(true);
			try {
				const params = new URLSearchParams({
					page: String(opts.page),
					limit: String(PAGE_SIZE),
				});
				if (opts.search) params.set("search", opts.search);
				if (opts.status !== "all") params.set("status", opts.status);
				if (opts.plan !== "all") params.set("plan", opts.plan);

				const res = await apiClient.get(`/api/subscriptions/transactions?${params}`);
				setTransactions(res.data.data.transactions);
				setTotal(res.data.data.total);
			} catch {
				errorToast("Failed to load transactions");
			} finally {
				setLoading(false);
			}
		},
		[]
	);

	// Reload when filters/page change
	useEffect(() => {
		loadTransactions({ page, search, status: statusFilter, plan: planFilter });
	}, [page, statusFilter, planFilter, loadTransactions]); // search is debounced separately

	// Debounce search
	const handleSearch = (value: string) => {
		setSearch(value);
		if (searchTimeout.current) clearTimeout(searchTimeout.current);
		searchTimeout.current = setTimeout(() => {
			setPage(1);
			loadTransactions({ page: 1, search: value, status: statusFilter, plan: planFilter });
		}, 350);
	};

	const handleFilterChange = (fn: () => void) => {
		fn();
		setPage(1);
	};

	const selectedStatus = STATUS_OPTIONS.find((o) => o.value === statusFilter)!;
	const selectedPlan = PLAN_OPTIONS.find((o) => o.value === planFilter)!;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<section className="space-y-6 w-full">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
				<div className="flex items-center gap-3">
					<button
						onClick={() => router.back()}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:hover:text-slate-200 shrink-0"
					>
						<ArrowLeft className="h-4 w-4" />
					</button>
					<div>
						<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
							All Transactions
						</h2>
						<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
							Full history of subscription billing activity
						</p>
					</div>
				</div>
			</div>

			{/* Filter bar */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 flex flex-wrap items-center gap-2 px-4 py-2.5">
				{/* Search */}
				<div className="flex flex-1 items-center gap-2 min-w-48">
					<Search className="h-4 w-4 shrink-0 text-slate-400" />
					<input
						type="text"
						placeholder="Search by company..."
						value={search}
						onChange={(e) => handleSearch(e.target.value)}
						className="w-full bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200"
					/>
					{loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />}
				</div>

				<div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

				{/* Status filter */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
						>
							{selectedStatus.label}
							<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-40 rounded-xl p-1.5 dark:bg-slate-900 dark:border-slate-800"
					>
						{STATUS_OPTIONS.map((opt) => (
							<DropdownMenuItem
								key={opt.value}
								onClick={() => handleFilterChange(() => setStatus(opt.value))}
								className={clsx(
									"flex items-center justify-between rounded-lg text-[13px] cursor-pointer",
									statusFilter === opt.value && "font-semibold"
								)}
							>
								{opt.label}
								{statusFilter === opt.value && (
									<Check className="h-3.5 w-3.5 text-blue-500" />
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Plan filter */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
						>
							{selectedPlan.label}
							<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-40 rounded-xl p-1.5 dark:bg-slate-900 dark:border-slate-800"
					>
						{PLAN_OPTIONS.map((opt) => (
							<DropdownMenuItem
								key={opt.value}
								onClick={() => handleFilterChange(() => setPlan(opt.value))}
								className={clsx(
									"flex items-center justify-between rounded-lg text-[13px] cursor-pointer",
									planFilter === opt.value && "font-semibold"
								)}
							>
								{opt.label}
								{planFilter === opt.value && (
									<Check className="h-3.5 w-3.5 text-blue-500" />
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Table */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 overflow-hidden pb-4">
				<table className="w-full">
					<thead>
						<tr className="border-b border-slate-100 dark:border-slate-800">
							{["COMPANY", "PLAN", "AMOUNT", "DATE", "STATUS"].map((h) => (
								<th
									key={h}
									className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							[...Array(PAGE_SIZE)].map((_, i) => <RowSkeleton key={i} />)
						) : transactions.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="py-16 text-center text-[14px] text-slate-400"
								>
									No transactions found.
								</td>
							</tr>
						) : (
							transactions.map((tx) => (
								<tr
									key={tx.id}
									className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
								>
									<td className="px-6 py-4 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
										{tx.company}
									</td>
									<td className="px-6 py-4 text-[13px] text-slate-500 dark:text-slate-400">
										{tx.plan}
									</td>
									<td className="px-6 py-4 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
										{tx.amount}
									</td>
									<td className="px-6 py-4 text-[13px] text-slate-400">
										{tx.date}
									</td>
									<td className="px-6 py-4">
										<span
											className={clsx(
												"inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
												STATUS_STYLES[tx.status]
											)}
										>
											{tx.status}
										</span>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				{total > 0 && (
					<div className="mt-2 px-2">
						<PaginationBar
							currentPage={page}
							totalPages={totalPages}
							totalItems={total}
							itemName="transactions"
							pageSize={PAGE_SIZE}
							onPageChange={setPage}
							className="border-0 shadow-none px-4"
						/>
					</div>
				)}
			</div>
		</section>
	);
};

export default AllTransactionsPage;
