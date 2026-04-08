"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
	DollarSign,
	CreditCard,
	RefreshCw,
	TrendingDown,
	TrendingUp,
	Check,
	Plus,
	Trash2,
	X,
	ChevronDown,
	Loader2,
} from "lucide-react";
import clsx from "clsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/apiClient";
import { successToast, errorToast } from "@/shared/helper/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = {
	id: number;
	name: string;
	display_name: string;
	price: number;
	billing_period: string;
	active_users: number;
	features: string[];
	color: string;
	is_public: boolean;
};

type Summary = {
	monthly_revenue: number;
	revenue_growth_pct: number;
	active_subscriptions: number;
	total_companies: number;
	renewals_this_month: number;
	expiring_soon: number;
	churn_rate: number;
	churn_diff: number;
};

type Transaction = {
	id: number;
	company: string;
	plan: string;
	amount: string;
	date: string;
	status: "Completed" | "Pending" | "Failed" | "Refunded";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_COLORS = [
	{ label: "Slate", value: "#64748b" },
	{ label: "Blue", value: "#3b82f6" },
	{ label: "Violet", value: "#8b5cf6" },
	{ label: "Green", value: "#22c55e" },
	{ label: "Orange", value: "#f97316" },
	{ label: "Red", value: "#ef4444" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtRevenue = (n: number) =>
	n >= 1_000_000
		? `$${(n / 1_000_000).toFixed(1)}M`
		: n >= 1_000
			? `$${(n / 1_000).toFixed(1)}K`
			: `$${n.toFixed(0)}`;

// ─── Stat Card ────────────────────────────────────────────────────────────────

type StatCardProps = {
	icon: React.ReactNode;
	iconBg: string;
	label: string;
	value: string;
	diff: string;
	diffUp: boolean;
	loading?: boolean;
};

const StatCard = ({ icon, iconBg, label, value, diff, diffUp, loading }: StatCardProps) => (
	<div className="flex flex-col gap-3 rounded-2xl bg-white border border-slate-100 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
		<div className="flex items-center justify-between">
			<div
				className="flex h-10 w-10 items-center justify-center rounded-xl"
				style={{ backgroundColor: iconBg }}
			>
				{icon}
			</div>
			{diffUp ? (
				<TrendingUp className="h-4 w-4 text-emerald-500" />
			) : (
				<TrendingDown className="h-4 w-4 text-rose-400" />
			)}
		</div>
		<div>
			<p className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
				{label}
			</p>
			{loading ? (
				<div className="mt-1.5 h-8 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
			) : (
				<p className="mt-0.5 text-[26px] font-bold text-slate-900 dark:text-slate-50">
					{value}
				</p>
			)}
			{loading ? (
				<div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
			) : (
				<p className={clsx("mt-1 text-[12px] font-medium", diffUp ? "text-emerald-500" : "text-rose-400")}>
					{diff}
				</p>
			)}
		</div>
	</div>
);

// ─── Edit Plan Modal ──────────────────────────────────────────────────────────

const EditPlanModal = ({
	plan,
	onClose,
	onSave,
	saving,
}: {
	plan: Plan;
	onClose: () => void;
	onSave: (updated: Partial<Plan> & { id: number }) => void;
	saving: boolean;
}) => {
	const [displayName, setDisplayName] = useState(plan.display_name);
	const [price, setPrice] = useState(String(plan.price));
	const [billingPeriod, setBillingPeriod] = useState(plan.billing_period);
	const [features, setFeatures] = useState<string[]>([...plan.features]);
	const [color, setColor] = useState(plan.color);
	const [isPublic, setIsPublic] = useState(plan.is_public);

	const addFeature = () => setFeatures((prev) => [...prev, ""]);
	const removeFeature = (i: number) => setFeatures((prev) => prev.filter((_, idx) => idx !== i));
	const updateFeature = (i: number, val: string) =>
		setFeatures((prev) => prev.map((f, idx) => (idx === i ? val : f)));

	const handleSave = () => {
		onSave({
			id: plan.id,
			display_name: displayName.trim() || plan.display_name,
			price: parseFloat(price) || plan.price,
			billing_period: billingPeriod,
			features: features.filter((f) => f.trim()),
			color,
			is_public: isPublic,
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800 mx-4">
				<div className="flex items-start justify-between p-6 pb-4">
					<div>
						<h2 className="text-[17px] font-bold text-slate-900 dark:text-slate-50">
							Edit {plan.display_name} Plan
						</h2>
						<p className="text-[12px] text-slate-400 mt-0.5">
							Configure pricing and features
						</p>
					</div>
					<button
						onClick={onClose}
						disabled={saving}
						className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800 disabled:opacity-50"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="px-6 pb-6 space-y-4">
					{/* Display Name */}
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Plan Name <span className="text-red-500">*</span>
						</label>
						<input
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
						/>
					</div>

					{/* Price + Billing Period */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
								Price <span className="text-red-500">*</span>
							</label>
							<div className="mt-1.5 flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800">
								<span className="pl-3 text-[13px] text-slate-400">$</span>
								<input
									type="number"
									value={price}
									onChange={(e) => setPrice(e.target.value)}
									className="flex-1 bg-transparent px-2 py-2.5 text-[13px] text-slate-800 outline-none dark:text-slate-100"
								/>
							</div>
						</div>
						<div>
							<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
								Billing Period <span className="text-red-500">*</span>
							</label>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 hover:border-slate-300 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
									>
										<span>{billingPeriod === "month" ? "Monthly" : "Yearly"}</span>
										<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="start"
									className="w-[--radix-dropdown-menu-trigger-width] rounded-xl p-1 dark:bg-slate-800 dark:border-slate-700"
								>
									{[
										{ label: "Monthly", value: "month" },
										{ label: "Yearly", value: "year" },
									].map((opt) => (
										<DropdownMenuItem
											key={opt.value}
											onClick={() => setBillingPeriod(opt.value)}
											className="flex items-center justify-between rounded-lg text-[13px] cursor-pointer"
										>
											{opt.label}
											{billingPeriod === opt.value && (
												<Check className="h-3.5 w-3.5 text-blue-500" />
											)}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{/* Features */}
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Plan Features
						</label>
						<div className="mt-1.5 space-y-2">
							{features.map((f, i) => (
								<div key={i} className="flex items-center gap-2">
									<input
										value={f}
										onChange={(e) => updateFeature(i, e.target.value)}
										className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
									/>
									<button
										onClick={() => removeFeature(i)}
										className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors dark:border-red-900/30 dark:hover:bg-red-950/20"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							))}
						</div>
						<button
							onClick={addFeature}
							className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-blue-500 hover:text-blue-600 transition-colors"
						>
							<Plus className="h-3.5 w-3.5" />
							Add Feature
						</button>
					</div>

					{/* Color */}
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Plan Color
						</label>
						<div className="mt-2 flex items-center gap-2">
							{PLAN_COLORS.map((c) => (
								<button
									key={c.value}
									onClick={() => setColor(c.value)}
									title={c.label}
									className="relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
									style={{ backgroundColor: c.value }}
								>
									{color === c.value && (
										<Check className="h-4 w-4 text-white stroke-3" />
									)}
								</button>
							))}
						</div>
					</div>

					{/* Public toggle */}
					<label className="flex items-center gap-2.5 cursor-pointer">
						<input
							type="checkbox"
							checked={isPublic}
							onChange={(e) => setIsPublic(e.target.checked)}
							className="h-4 w-4 rounded border-slate-300 accent-blue-500"
						/>
						<span className="text-[13px] text-slate-600 dark:text-slate-400">
							Show this plan on public pricing page
						</span>
					</label>

					{/* Footer */}
					<div className="flex items-center justify-end gap-2 pt-2">
						<button
							onClick={onClose}
							disabled={saving}
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={saving}
							className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors disabled:opacity-50"
						>
							{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
							Save Changes
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: Transaction["status"] }) => {
	const styles: Record<Transaction["status"], string> = {
		Completed: "bg-emerald-500 text-white",
		Pending: "bg-amber-400 text-white",
		Failed: "bg-red-500 text-white",
		Refunded: "bg-slate-400 text-white",
	};
	return (
		<span
			className={clsx(
				"inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
				styles[status]
			)}
		>
			{status}
		</span>
	);
};

// ─── Skeleton rows ────────────────────────────────────────────────────────────

const TxRowSkeleton = () => (
	<tr className="border-b border-slate-50 dark:border-slate-800/50">
		{[160, 80, 70, 100, 70].map((w, i) => (
			<td key={i} className="py-3.5">
				<div
					className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
					style={{ width: w }}
				/>
			</td>
		))}
	</tr>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const SubscriptionsPage = () => {
	const [plans, setPlans] = useState<Plan[]>([]);
	const [summary, setSummary] = useState<Summary | null>(null);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loadingPlans, setLoadingPlans] = useState(true);
	const [loadingSummary, setLoadingSummary] = useState(true);
	const [loadingTx, setLoadingTx] = useState(true);
	const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
	const [savingPlan, setSavingPlan] = useState(false);

	// ── Load ──────────────────────────────────────────────────────────────────

	const loadAll = useCallback(async () => {
		setLoadingPlans(true);
		setLoadingSummary(true);
		setLoadingTx(true);

		const [plansRes, summaryRes, txRes] = await Promise.allSettled([
			apiClient.get("/api/subscriptions/plans"),
			apiClient.get("/api/subscriptions/summary"),
			apiClient.get("/api/subscriptions/transactions?limit=5"),
		]);

		if (plansRes.status === "fulfilled") {
			setPlans(plansRes.value.data.data.plans);
		} else {
			errorToast("Failed to load plans");
		}
		setLoadingPlans(false);

		if (summaryRes.status === "fulfilled") {
			setSummary(summaryRes.value.data.data);
		} else {
			errorToast("Failed to load summary");
		}
		setLoadingSummary(false);

		if (txRes.status === "fulfilled") {
			setTransactions(txRes.value.data.data.transactions);
		} else {
			errorToast("Failed to load transactions");
		}
		setLoadingTx(false);
	}, []);

	useEffect(() => {
		loadAll();
	}, [loadAll]);

	// ── Edit plan ─────────────────────────────────────────────────────────────

	const handleSavePlan = async (updated: Partial<Plan> & { id: number }) => {
		setSavingPlan(true);
		try {
			const { id, ...body } = updated;
			const res = await apiClient.put(`/api/subscriptions/plans/${id}`, body);
			const savedPlan: Plan = res.data.data.plan;
			setPlans((prev) => prev.map((p) => (p.id === id ? savedPlan : p)));
			setEditingPlan(null);
			successToast("Plan updated successfully.");
		} catch {
			errorToast("Failed to save plan");
		} finally {
			setSavingPlan(false);
		}
	};

	// ── Derived summary values ────────────────────────────────────────────────

	const revenueGrowthUp = (summary?.revenue_growth_pct ?? 0) >= 0;
	const churnUp = (summary?.churn_diff ?? 0) <= 0; // lower churn = good

	return (
		<section className="space-y-6 w-full">
			{/* Header */}
			<div className="px-2">
				<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
					Subscriptions & Billing
				</h2>
				<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
					Manage pricing plans and monitor revenue
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
					iconBg="#dcfce7"
					label="Monthly Revenue"
					value={fmtRevenue(summary?.monthly_revenue ?? 0)}
					diff={
						summary
							? `${revenueGrowthUp ? "+" : ""}${summary.revenue_growth_pct}% from last month`
							: "—"
					}
					diffUp={revenueGrowthUp}
					loading={loadingSummary}
				/>
				<StatCard
					icon={<CreditCard className="h-5 w-5 text-blue-600" />}
					iconBg="#dbeafe"
					label="Active Subscriptions"
					value={String(summary?.active_subscriptions ?? 0)}
					diff={
						summary ? `${summary.total_companies} companies total` : "—"
					}
					diffUp
					loading={loadingSummary}
				/>
				<StatCard
					icon={<RefreshCw className="h-5 w-5 text-amber-500" />}
					iconBg="#fef3c7"
					label="Renewals This Month"
					value={String(summary?.renewals_this_month ?? 0)}
					diff={
						summary ? `${summary.expiring_soon} expiring soon` : "—"
					}
					diffUp
					loading={loadingSummary}
				/>
				<StatCard
					icon={<TrendingDown className="h-5 w-5 text-rose-500" />}
					iconBg="#fee2e2"
					label="Churn Rate"
					value={summary ? `${summary.churn_rate}%` : "—"}
					diff={
						summary
							? summary.churn_diff <= 0
								? `${Math.abs(summary.churn_diff)}% improvement`
								: `+${summary.churn_diff}% increase`
							: "—"
					}
					diffUp={churnUp}
					loading={loadingSummary}
				/>
			</div>

			{/* Pricing Plans */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-6">
				<h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 mb-5">
					Pricing Plans
				</h3>
				{loadingPlans ? (
					<div className="grid gap-4 md:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900"
							>
								<div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
								<div className="h-4 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
								<div className="h-8 w-28 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
								<div className="space-y-2 mt-2">
									{[1, 2, 3].map((j) => (
										<div key={j} className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-3">
						{plans.map((plan) => (
							<div
								key={plan.id}
								className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900"
							>
								<div
									className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
									style={{ backgroundColor: plan.color + "20" }}
								>
									<CreditCard className="h-5 w-5" style={{ color: plan.color }} />
								</div>
								<p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
									{plan.display_name}
								</p>
								<p className="mt-0.5 text-[30px] font-bold text-slate-900 dark:text-slate-50 leading-none">
									${plan.price}
									<span className="text-[13px] font-normal text-slate-400">
										/{plan.billing_period}
									</span>
								</p>
								<p className="mt-1.5 text-[12px] text-slate-400">
									{plan.active_users} active users
								</p>
								<ul className="mt-4 space-y-2 flex-1">
									{plan.features.map((f) => (
										<li key={f} className="flex items-center gap-2">
											<Check className="h-4 w-4 shrink-0" style={{ color: plan.color }} />
											<span className="text-[13px] text-slate-600 dark:text-slate-300">
												{f}
											</span>
										</li>
									))}
								</ul>
								<button
									onClick={() => setEditingPlan(plan)}
									className="mt-5 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
									style={{ backgroundColor: plan.color }}
								>
									Edit Plan
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Recent Transactions */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-6">
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">
						Recent Transactions
					</h3>
					<Link
						href="/subscriptions/all"
						className="text-[13px] font-semibold text-blue-500 hover:text-blue-600 transition-colors"
					>
						View All
					</Link>
				</div>

				<table className="w-full">
					<thead>
						<tr className="border-b border-slate-100 dark:border-slate-800">
							{["COMPANY", "PLAN", "AMOUNT", "DATE", "STATUS"].map((h) => (
								<th
									key={h}
									className="pb-3 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loadingTx ? (
							[...Array(4)].map((_, i) => <TxRowSkeleton key={i} />)
						) : transactions.length === 0 ? (
							<tr>
								<td colSpan={5} className="py-10 text-center text-[14px] text-slate-400">
									No transactions yet.
								</td>
							</tr>
						) : (
							transactions.map((tx) => (
								<tr
									key={tx.id}
									className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
								>
									<td className="py-3.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
										{tx.company}
									</td>
									<td className="py-3.5 text-[13px] text-slate-500 dark:text-slate-400">
										{tx.plan}
									</td>
									<td className="py-3.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
										{tx.amount}
									</td>
									<td className="py-3.5 text-[13px] text-slate-400">{tx.date}</td>
									<td className="py-3.5">
										<StatusBadge status={tx.status} />
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Edit Plan Modal */}
			{editingPlan && (
				<EditPlanModal
					plan={editingPlan}
					onClose={() => setEditingPlan(null)}
					onSave={handleSavePlan}
					saving={savingPlan}
				/>
			)}
		</section>
	);
};

export default SubscriptionsPage;
