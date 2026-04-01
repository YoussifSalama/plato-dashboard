"use client";

import { useState } from "react";
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
} from "lucide-react";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = {
	id: number;
	name: string;
	price: number;
	billingPeriod: string;
	activeUsers: number;
	features: string[];
	color: string;
	public: boolean;
};

type Transaction = {
	id: number;
	company: string;
	plan: string;
	amount: string;
	date: string;
	status: "Completed" | "Pending" | "Failed";
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const PLAN_COLORS = [
	{ label: "Slate", value: "#64748b" },
	{ label: "Blue", value: "#3b82f6" },
	{ label: "Violet", value: "#8b5cf6" },
	{ label: "Green", value: "#22c55e" },
	{ label: "Orange", value: "#f97316" },
	{ label: "Red", value: "#ef4444" },
];

const INITIAL_PLANS: Plan[] = [
	{
		id: 1,
		name: "Basic",
		price: 29,
		billingPeriod: "month",
		activeUsers: 145,
		features: ["5 Job Posts", "50 Candidates", "Basic Analytics"],
		color: "#64748b",
		public: true,
	},
	{
		id: 2,
		name: "Pro",
		price: 99,
		billingPeriod: "month",
		activeUsers: 463,
		features: [
			"20 Job Posts",
			"200 Candidates",
			"Advanced Analytics",
			"Priority Support",
		],
		color: "#3b82f6",
		public: true,
	},
	{
		id: 3,
		name: "Enterprise",
		price: 299,
		billingPeriod: "month",
		activeUsers: 49,
		features: [
			"Unlimited Jobs",
			"Unlimited Candidates",
			"Custom Analytics",
			"Dedicated Manager",
		],
		color: "#8b5cf6",
		public: true,
	},
];

const MOCK_TRANSACTIONS: Transaction[] = [
	{
		id: 1,
		company: "Acme Corp",
		plan: "Pro",
		amount: "$99.00",
		date: "Feb 20, 2025",
		status: "Completed",
	},
	{
		id: 2,
		company: "Tech Solutions",
		plan: "Enterprise",
		amount: "$299.00",
		date: "Feb 13, 2025",
		status: "Completed",
	},
	{
		id: 3,
		company: "Global Industries",
		plan: "Pro",
		amount: "$99.00",
		date: "Feb 13, 2025",
		status: "Completed",
	},
	{
		id: 4,
		company: "Startup Inc.",
		plan: "Basic",
		amount: "$29.00",
		date: "Feb 17, 2025",
		status: "Pending",
	},
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

type StatCardProps = {
	icon: React.ReactNode;
	iconBg: string;
	label: string;
	value: string;
	diff: string;
	diffUp: boolean;
};

const StatCard = ({ icon, iconBg, label, value, diff, diffUp }: StatCardProps) => (
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
			<p className="mt-0.5 text-[26px] font-bold text-slate-900 dark:text-slate-50">
				{value}
			</p>
			<p
				className={clsx(
					"mt-1 text-[12px] font-medium",
					diffUp ? "text-emerald-500" : "text-rose-400"
				)}
			>
				{diff}
			</p>
		</div>
	</div>
);

// ─── Edit Plan Modal ──────────────────────────────────────────────────────────

type EditModalProps = {
	plan: Plan;
	onClose: () => void;
	onSave: (updated: Plan) => void;
};

const EditPlanModal = ({ plan, onClose, onSave }: EditModalProps) => {
	const [name, setName] = useState(plan.name);
	const [price, setPrice] = useState(String(plan.price));
	const [billingPeriod, setBillingPeriod] = useState(plan.billingPeriod);
	const [features, setFeatures] = useState<string[]>([...plan.features]);
	const [color, setColor] = useState(plan.color);
	const [isPublic, setIsPublic] = useState(plan.public);

	const addFeature = () => setFeatures((prev) => [...prev, ""]);
	const removeFeature = (i: number) =>
		setFeatures((prev) => prev.filter((_, idx) => idx !== i));
	const updateFeature = (i: number, val: string) =>
		setFeatures((prev) => prev.map((f, idx) => (idx === i ? val : f)));

	const handleSave = () => {
		onSave({
			...plan,
			name: name.trim() || plan.name,
			price: parseFloat(price) || plan.price,
			billingPeriod,
			features: features.filter((f) => f.trim()),
			color,
			public: isPublic,
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800 mx-4">
				{/* Header */}
				<div className="flex items-start justify-between p-6 pb-4">
					<div>
						<h2 className="text-[17px] font-bold text-slate-900 dark:text-slate-50">
							Edit {plan.name} Plan
						</h2>
						<p className="text-[12px] text-slate-400 mt-0.5">
							Configure pricing and features
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
					{/* Plan Name */}
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Plan Name <span className="text-red-500">*</span>
						</label>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
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
							<select
								value={billingPeriod}
								onChange={(e) => setBillingPeriod(e.target.value)}
								className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
							>
								<option value="month">Monthly</option>
								<option value="year">Yearly</option>
							</select>
						</div>
					</div>

					{/* Plan Features */}
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

					{/* Plan Color */}
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

					{/* Footer actions */}
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

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: Transaction["status"] }) => {
	const styles = {
		Completed: "bg-emerald-500 text-white",
		Pending: "bg-amber-400 text-white",
		Failed: "bg-red-500 text-white",
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const SubscriptionsPage = () => {
	const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
	const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

	const handleSave = (updated: Plan) => {
		setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
		setEditingPlan(null);
	};

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
					value="$67,429"
					diff="+12.5% from last month"
					diffUp
				/>
				<StatCard
					icon={<CreditCard className="h-5 w-5 text-blue-600" />}
					iconBg="#dbeafe"
					label="Active Subscriptions"
					value="657"
					diff="846 companies subscribed"
					diffUp
				/>
				<StatCard
					icon={<RefreshCw className="h-5 w-5 text-amber-500" />}
					iconBg="#fef3c7"
					label="Renewals This Month"
					value="124"
					diff="28 expiring soon"
					diffUp
				/>
				<StatCard
					icon={<TrendingDown className="h-5 w-5 text-rose-500" />}
					iconBg="#fee2e2"
					label="Churn Rate"
					value="3.2%"
					diff="-0.8% improvement"
					diffUp={false}
				/>
			</div>

			{/* Pricing Plans */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-6">
				<h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 mb-5">
					Pricing Plans
				</h3>
				<div className="grid gap-4 md:grid-cols-3">
					{plans.map((plan) => (
						<div
							key={plan.id}
							className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900"
						>
							{/* Icon */}
							<div
								className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
								style={{ backgroundColor: plan.color + "20" }}
							>
								<CreditCard
									className="h-5 w-5"
									style={{ color: plan.color }}
								/>
							</div>

							{/* Name & price */}
							<p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
								{plan.name}
							</p>
							<p className="mt-0.5 text-[30px] font-bold text-slate-900 dark:text-slate-50 leading-none">
								${plan.price}
								<span className="text-[13px] font-normal text-slate-400">
									/{plan.billingPeriod}
								</span>
							</p>
							<p className="mt-1.5 text-[12px] text-slate-400">
								{plan.activeUsers} active users
							</p>

							{/* Features */}
							<ul className="mt-4 space-y-2 flex-1">
								{plan.features.map((f) => (
									<li key={f} className="flex items-center gap-2">
										<Check
											className="h-4 w-4 shrink-0"
											style={{ color: plan.color }}
										/>
										<span className="text-[13px] text-slate-600 dark:text-slate-300">
											{f}
										</span>
									</li>
								))}
							</ul>

							{/* Edit button */}
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
			</div>

			{/* Recent Transactions */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-6">
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">
						Recent Transactions
					</h3>
					<button className="text-[13px] font-semibold text-blue-500 hover:text-blue-600 transition-colors">
						View All
					</button>
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
						{MOCK_TRANSACTIONS.map((tx) => (
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
								<td className="py-3.5 text-[13px] text-slate-400">
									{tx.date}
								</td>
								<td className="py-3.5">
									<StatusBadge status={tx.status} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Edit Modal */}
			{editingPlan && (
				<EditPlanModal
					plan={editingPlan}
					onClose={() => setEditingPlan(null)}
					onSave={handleSave}
				/>
			)}
		</section>
	);
};

export default SubscriptionsPage;
