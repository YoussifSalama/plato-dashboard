"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Search,
	ChevronDown,
	Check,
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

type TxStatus = "Completed" | "Pending" | "Failed" | "Refunded";

type Transaction = {
	id: number;
	company: string;
	plan: string;
	amount: string;
	amountRaw: number;
	date: string;
	status: TxStatus;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: Transaction[] = [
	{ id: 1,  company: "Acme Corp",          plan: "Pro",        amount: "$99.00",  amountRaw: 99,  date: "Feb 20, 2025", status: "Completed" },
	{ id: 2,  company: "Tech Solutions",     plan: "Enterprise", amount: "$299.00", amountRaw: 299, date: "Feb 13, 2025", status: "Completed" },
	{ id: 3,  company: "Global Industries",  plan: "Pro",        amount: "$99.00",  amountRaw: 99,  date: "Feb 13, 2025", status: "Completed" },
	{ id: 4,  company: "Startup Inc.",       plan: "Basic",      amount: "$29.00",  amountRaw: 29,  date: "Feb 17, 2025", status: "Pending"   },
	{ id: 5,  company: "Bright Minds Ltd",   plan: "Enterprise", amount: "$299.00", amountRaw: 299, date: "Feb 10, 2025", status: "Completed" },
	{ id: 6,  company: "Nova Analytics",     plan: "Pro",        amount: "$99.00",  amountRaw: 99,  date: "Feb 09, 2025", status: "Completed" },
	{ id: 7,  company: "Horizon Co.",        plan: "Basic",      amount: "$29.00",  amountRaw: 29,  date: "Feb 08, 2025", status: "Failed"    },
	{ id: 8,  company: "Vertex Systems",     plan: "Pro",        amount: "$99.00",  amountRaw: 99,  date: "Feb 07, 2025", status: "Refunded"  },
	{ id: 9,  company: "Pulse Media",        plan: "Enterprise", amount: "$299.00", amountRaw: 299, date: "Feb 06, 2025", status: "Completed" },
	{ id: 10, company: "Delta Corp",         plan: "Basic",      amount: "$29.00",  amountRaw: 29,  date: "Feb 05, 2025", status: "Completed" },
	{ id: 11, company: "Orion Digital",      plan: "Pro",        amount: "$99.00",  amountRaw: 99,  date: "Feb 04, 2025", status: "Pending"   },
	{ id: 12, company: "Summit Labs",        plan: "Enterprise", amount: "$299.00", amountRaw: 299, date: "Feb 03, 2025", status: "Completed" },
	{ id: 13, company: "Catalyst Group",     plan: "Pro",        amount: "$99.00",  amountRaw: 99,  date: "Feb 02, 2025", status: "Completed" },
	{ id: 14, company: "Apex Solutions",     plan: "Basic",      amount: "$29.00",  amountRaw: 29,  date: "Feb 01, 2025", status: "Failed"    },
	{ id: 15, company: "Stride Technologies",plan: "Pro",        amount: "$99.00",  amountRaw: 99,  date: "Jan 31, 2025", status: "Completed" },
];

const STATUS_OPTIONS: { label: string; value: TxStatus | "all" }[] = [
	{ label: "All Status",  value: "all"       },
	{ label: "Completed",   value: "Completed" },
	{ label: "Pending",     value: "Pending"   },
	{ label: "Failed",      value: "Failed"    },
	{ label: "Refunded",    value: "Refunded"  },
];

const PLAN_OPTIONS = [
	{ label: "All Plans",   value: "all"        },
	{ label: "Basic",       value: "Basic"      },
	{ label: "Pro",         value: "Pro"        },
	{ label: "Enterprise",  value: "Enterprise" },
];

const STATUS_STYLES: Record<TxStatus, string> = {
	Completed: "bg-emerald-500 text-white",
	Pending:   "bg-amber-400 text-white",
	Failed:    "bg-red-500 text-white",
	Refunded:  "bg-slate-400 text-white",
};

const PAGE_SIZE = 8;

// ─── Page ─────────────────────────────────────────────────────────────────────

const AllTransactionsPage = () => {
	const router = useRouter();
	const [search, setSearch]       = useState("");
	const [statusFilter, setStatus] = useState<TxStatus | "all">("all");
	const [planFilter, setPlan]     = useState("all");
	const [page, setPage]           = useState(1);

	const filtered = MOCK_TRANSACTIONS.filter((tx) => {
		const matchSearch =
			!search || tx.company.toLowerCase().includes(search.toLowerCase());
		const matchStatus = statusFilter === "all" || tx.status === statusFilter;
		const matchPlan   = planFilter === "all" || tx.plan === planFilter;
		return matchSearch && matchStatus && matchPlan;
	});

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const selectedStatus = STATUS_OPTIONS.find((o) => o.value === statusFilter)!;
	const selectedPlan   = PLAN_OPTIONS.find((o) => o.value === planFilter)!;

	const handleFilterChange = (fn: () => void) => {
		fn();
		setPage(1);
	};

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
						onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
						className="w-full bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200"
					/>
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
					<DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5 dark:bg-slate-900 dark:border-slate-800">
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
								{statusFilter === opt.value && <Check className="h-3.5 w-3.5 text-blue-500" />}
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
					<DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5 dark:bg-slate-900 dark:border-slate-800">
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
								{planFilter === opt.value && <Check className="h-3.5 w-3.5 text-blue-500" />}
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
						{paginated.length === 0 ? (
							<tr>
								<td colSpan={5} className="py-16 text-center text-[14px] text-slate-400">
									No transactions found.
								</td>
							</tr>
						) : (
							paginated.map((tx) => (
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

				{filtered.length > 0 && (
					<div className="mt-2 px-2">
						<PaginationBar
							currentPage={page}
							totalPages={totalPages}
							totalItems={filtered.length}
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
