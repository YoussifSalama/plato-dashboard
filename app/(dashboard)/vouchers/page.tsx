"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Gift,
	BarChart2,
	DollarSign,
	Clock,
	Plus,
	Copy,
	Pencil,
	X,
	Calendar,
	Check,
	AlertTriangle,
	Loader2,
} from "lucide-react";
import clsx from "clsx";
import { apiClient } from "@/lib/apiClient";
import { successToast, errorToast } from "@/shared/helper/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type VoucherStatus = "Active" | "Expired" | "Inactive";

type Voucher = {
	id: number;
	code: string;
	discount: number;
	type: "%" | "$";
	usage: { used: number; limit: number | null };
	expires: string | null;
	status: VoucherStatus;
	features: string[];
	plans: string[];
	color: string;
	revenue_impact: number;
};

type Summary = {
	active_vouchers: number;
	total_redemptions: number;
	revenue_impact: number;
	expiring_soon: number;
};

type VoucherForm = {
	code: string;
	discountType: "Percentage" | "Fixed" | "";
	discountValue: string;
	usageLimit: string;
	expiryDate: string;
	plans: string[];
	description: string;
	activateNow: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────


const EMPTY_FORM: VoucherForm = {
	code: "",
	discountType: "",
	discountValue: "",
	usageLimit: "",
	expiryDate: "",
	plans: [],
	description: "",
	activateNow: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const usagePct = (used: number, limit: number) =>
	Math.min(100, Math.round((used / limit) * 100));

const barColor = (pct: number) =>
	pct >= 100 ? "#ef4444" : pct >= 75 ? "#f97316" : "#22c55e";

const fmtDate = (iso: string | null) => {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

const fmtRevenue = (n: number) =>
	n >= 1_000_000
		? `$${(n / 1_000_000).toFixed(1)}M`
		: n >= 1_000
			? `$${(n / 1_000).toFixed(1)}K`
			: `$${n.toFixed(0)}`;

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
	icon,
	iconBg,
	iconColor,
	label,
	value,
	loading,
}: {
	icon: React.ReactNode;
	iconBg: string;
	iconColor: string;
	label: string;
	value: string;
	loading?: boolean;
}) => (
	<div className="flex flex-col gap-4 rounded-2xl bg-white border border-slate-100 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
		<div
			className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
			style={{ backgroundColor: iconBg }}
		>
			<span style={{ color: iconColor }}>{icon}</span>
		</div>
		<div className="space-y-2">
			<p className="text-[14px] font-medium text-slate-400 dark:text-slate-500">
				{label}
			</p>
			{loading ? (
				<div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
			) : (
				<p className="mt-0.5 text-[26px] font-bold text-slate-900 dark:text-slate-50 leading-tight">
					{value}
				</p>
			)}
		</div>
	</div>
);

// ─── Usage Bar ────────────────────────────────────────────────────────────────

const UsageBar = ({ used, limit }: { used: number; limit: number | null }) => {
	if (limit === null) {
		return (
			<div className="flex flex-col gap-1 min-w-36">
				<span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
					{used} / ∞
				</span>
				<div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
			</div>
		);
	}
	const p = usagePct(used, limit);
	const color = barColor(p);
	return (
		<div className="flex flex-col gap-1 min-w-36">
			<div className="flex items-center justify-between">
				<span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
					{used} / {limit}
				</span>
				<span className="text-[10px] font-semibold" style={{ color: "#718096" }}>
					{p}%
				</span>
			</div>
			<div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
				<div
					className="h-full rounded-full transition-all"
					style={{ width: `${p}%`, backgroundColor: color }}
				/>
			</div>
		</div>
	);
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: VoucherStatus }) => {
	const styles: Record<VoucherStatus, string> = {
		Active: "bg-emerald-500 text-white",
		Expired: "bg-red-500 text-white",
		Inactive: "bg-slate-400 text-white",
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

// ─── Deactivate Confirm Modal ─────────────────────────────────────────────────

const DeactivateModal = ({
	voucher,
	onCancel,
	onConfirm,
	loading,
}: {
	voucher: Voucher;
	onCancel: () => void;
	onConfirm: () => void;
	loading: boolean;
}) => (
	<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<div className="w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800 mx-4 p-6">
			<div className="flex items-center gap-3 mb-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/40">
					<AlertTriangle className="h-5 w-5 text-red-500" />
				</div>
				<div>
					<h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">
						Deactivate Voucher
					</h3>
					<p className="text-[12px] text-slate-400 mt-0.5">
						Code:{" "}
						<span className="font-semibold text-slate-600 dark:text-slate-300">
							{voucher.code}
						</span>
					</p>
				</div>
			</div>
			<p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">
				Are you sure you want to deactivate this voucher? It will no longer be
				redeemable by users. You can reactivate it later.
			</p>
			<div className="flex items-center justify-end gap-2">
				<button
					onClick={onCancel}
					disabled={loading}
					className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
				>
					Cancel
				</button>
				<button
					onClick={onConfirm}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
				>
					{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
					Deactivate
				</button>
			</div>
		</div>
	</div>
);

// ─── Voucher Form Modal ───────────────────────────────────────────────────────

const VoucherModal = ({
	initial,
	onClose,
	onSave,
	saving,
	planOptions,
}: {
	initial: VoucherForm & { id?: number };
	onClose: () => void;
	onSave: (form: VoucherForm & { id?: number }) => void;
	saving: boolean;
	planOptions: { name: string; display_name: string }[];
}) => {
	const [form, setForm] = useState<VoucherForm & { id?: number }>(initial);
	const isEdit = Boolean(initial.id);

	const set = <K extends keyof VoucherForm>(key: K, val: VoucherForm[K]) =>
		setForm((prev) => ({ ...prev, [key]: val }));

	const togglePlan = (plan: string) =>
		set(
			"plans",
			form.plans.includes(plan)
				? form.plans.filter((p) => p !== plan)
				: [...form.plans, plan]
		);

	const valid =
		form.code.trim() &&
		form.discountType &&
		form.discountValue &&
		form.expiryDate;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800 mx-4 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 z-10 flex items-start justify-between bg-white px-6 pt-6 pb-4 dark:bg-slate-900">
					<div>
						<h2 className="text-[17px] font-bold text-slate-900 dark:text-slate-50">
							{isEdit ? "Edit Voucher" : "Create New Voucher"}
						</h2>
						<p className="text-[12px] text-slate-400 mt-0.5">
							{isEdit ? "Update voucher details" : "Set up a new promotional code"}
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
					{/* Voucher Code */}
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Voucher Code <span className="text-red-500">*</span>
						</label>
						<input
							value={form.code}
							onChange={(e) => set("code", e.target.value.toUpperCase())}
							placeholder="E.G., SUMMER2026"
							className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
						/>
						<p className="mt-1 text-[11px] text-slate-400">
							Use uppercase letters and numbers only.
						</p>
					</div>

					{/* Discount Type + Value */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
								Discount Type <span className="text-red-500">*</span>
							</label>
							<div className="mt-1.5 flex rounded-xl border border-slate-200 overflow-hidden dark:border-slate-700">
								{(["Percentage", "Fixed"] as const).map((t) => (
									<button
										key={t}
										type="button"
										onClick={() => set("discountType", t)}
										className={clsx(
											"flex-1 py-2.5 text-[12px] font-semibold transition-colors",
											form.discountType === t
												? "bg-[#005ca9] text-white"
												: "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
										)}
									>
										{t}
									</button>
								))}
							</div>
						</div>
						<div>
							<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
								Discount Value <span className="text-red-500">*</span>
							</label>
							<div className="mt-1.5 flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800">
								<span className="pl-3 text-[13px] text-slate-400">
									{form.discountType === "Percentage" ? "%" : "$"}
								</span>
								<input
									type="number"
									value={form.discountValue}
									onChange={(e) => set("discountValue", e.target.value)}
									placeholder="e.g., 50"
									className="flex-1 bg-transparent px-2 py-2.5 text-[13px] text-slate-800 outline-none placeholder:text-slate-300 dark:text-slate-100"
								/>
							</div>
						</div>
					</div>

					{/* Usage Limit + Expiry */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
								Usage Limit{" "}
								<span className="font-normal text-slate-400">(Optional)</span>
							</label>
							<input
								type="number"
								value={form.usageLimit}
								onChange={(e) => set("usageLimit", e.target.value)}
								placeholder="Unlimited"
								className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
							/>
							<p className="mt-1 text-[11px] text-slate-400">
								Leave empty for unlimited uses
							</p>
						</div>
						<div>
							<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
								Expiry Date <span className="text-red-500">*</span>
							</label>
							<div className="mt-1.5 flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800">
								<input
									type="date"
									value={form.expiryDate}
									onChange={(e) => set("expiryDate", e.target.value)}
									className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-slate-800 outline-none dark:text-slate-100 dark::[color-scheme:dark]"
								/>
								<Calendar className="mr-3 h-4 w-4 text-slate-400 shrink-0" />
							</div>
						</div>
					</div>

					{/* Applicable Plans */}
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 block mb-2">
							Applicable Plans
						</label>
						<div className="space-y-2">
							{planOptions.length === 0 && (
								<p className="text-[12px] text-slate-400 italic">No plans found</p>
							)}
							{planOptions.map((plan) => (
								<label key={plan.name} className="flex items-center gap-2.5 cursor-pointer">
									<div
										onClick={() => togglePlan(plan.name)}
										className={clsx(
											"flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer",
											form.plans.includes(plan.name)
												? "border-[#005ca9] bg-[#005ca9]"
												: "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
										)}
									>
										{form.plans.includes(plan.name) && (
											<Check className="h-2.5 w-2.5 text-white stroke-3" />
										)}
									</div>
									<span
										className="text-[13px] text-slate-600 dark:text-slate-400 cursor-pointer"
										onClick={() => togglePlan(plan.name)}
									>
										{plan.display_name}
									</span>
								</label>
							))}
						</div>
					</div>

					{/* Description */}
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Description{" "}
							<span className="font-normal text-slate-400">(Optional)</span>
						</label>
						<textarea
							value={form.description}
							onChange={(e) => set("description", e.target.value)}
							placeholder="Add any internal notes about this voucher..."
							rows={3}
							className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
						/>
					</div>

					{/* Activate toggle */}
					<label className="flex items-center gap-2.5 cursor-pointer py-1">
						<input
							type="checkbox"
							checked={form.activateNow}
							onChange={(e) => set("activateNow", e.target.checked)}
							className="h-4 w-4 rounded border-slate-300 accent-[#005ca9]"
						/>
						<span className="text-[13px] text-slate-600 dark:text-slate-400">
							Activate voucher immediately
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
							onClick={() => valid && onSave(form)}
							disabled={!valid || saving}
							className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
							{isEdit ? "Save Changes" : "Create Voucher"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Row Skeleton ─────────────────────────────────────────────────────────────

const RowSkeleton = () => (
	<tr className="border-b border-slate-50 dark:border-slate-800/50">
		{[120, 60, 70, 160, 90, 70, 110].map((w, i) => (
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

const VouchersPage = () => {
	const [vouchers, setVouchers] = useState<Voucher[]>([]);
	const [summary, setSummary] = useState<Summary | null>(null);
	const [loading, setLoading] = useState(true);
	const [modalForm, setModalForm] = useState<(VoucherForm & { id?: number }) | null>(null);
	const [deactivating, setDeactivating] = useState<Voucher | null>(null);
	const [saving, setSaving] = useState(false);
	const [toggling, setToggling] = useState<number | null>(null);
	const [copied, setCopied] = useState<number | null>(null);
	const [planOptions, setPlanOptions] = useState<{ name: string; display_name: string }[]>([]);

	// ── Load subscription plans ────────────────────────────────────────────────

	useEffect(() => {
		apiClient
			.get("/api/subscriptions/plans")
			.then((res) => {
				const data = res.data?.data?.plans ?? [];
				setPlanOptions(
					data.map((p: { name: string; display_name: string }) => ({
						name: p.name,
						display_name: p.display_name,
					}))
				);
			})
			.catch(() => {/* keep empty — checkboxes just won't show */});
	}, []);

	// ── Load data ──────────────────────────────────────────────────────────────

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [summaryRes, listRes] = await Promise.all([
				apiClient.get("/api/vouchers?summary=1"),
				apiClient.get("/api/vouchers?limit=50"),
			]);
			setSummary(summaryRes.data.data);
			setVouchers(listRes.data.data.vouchers);
		} catch {
			errorToast("Failed to load vouchers");
		} finally {
			setLoading(false);
		}
	}, []);

	const refreshSummary = useCallback(async () => {
		try {
			const res = await apiClient.get("/api/vouchers?summary=1");
			setSummary(res.data.data);
		} catch {
			// silent — summary is supplemental
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// ── Copy code ──────────────────────────────────────────────────────────────

	const copyCode = (id: number, code: string) => {
		navigator.clipboard.writeText(code).catch(() => {});
		setCopied(id);
		setTimeout(() => setCopied(null), 1500);
	};

	// ── Open modals ────────────────────────────────────────────────────────────

	const openCreate = () => setModalForm({ ...EMPTY_FORM });

	const openEdit = (v: Voucher) =>
		setModalForm({
			id: v.id,
			code: v.code,
			discountType: v.type === "%" ? "Percentage" : "Fixed",
			discountValue: String(v.discount),
			usageLimit: v.usage.limit !== null ? String(v.usage.limit) : "",
			expiryDate: v.expires ? v.expires.substring(0, 10) : "",
			plans: [...v.plans],
			description: v.features[0] ?? "",
			activateNow: v.status === "Active",
		});

	// ── Save (create / edit) ───────────────────────────────────────────────────

	const handleSave = async (form: VoucherForm & { id?: number }) => {
		setSaving(true);
		try {
			const payload = {
				code: form.code,
				discount: parseFloat(form.discountValue),
				type: form.discountType === "Percentage" ? "PERCENTAGE" : "FIXED",
				usage_limit: form.usageLimit ? parseInt(form.usageLimit) : null,
				expires_at: form.expiryDate
					? new Date(form.expiryDate + "T00:00:00.000Z").toISOString()
					: null,
				is_active: form.activateNow,
				plans: form.plans,
				features: form.description ? [form.description] : [],
			};

			if (form.id) {
				await apiClient.put(`/api/vouchers/${form.id}`, payload);
				successToast("Voucher updated successfully.");
			} else {
				await apiClient.post("/api/vouchers", payload);
				successToast("Voucher created successfully.");
			}

			setModalForm(null);
			await loadData();
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message ?? "Failed to save voucher";
			errorToast(msg);
		} finally {
			setSaving(false);
		}
	};

	// ── Deactivate ─────────────────────────────────────────────────────────────

	const handleDeactivate = async () => {
		if (!deactivating) return;
		const id = deactivating.id;
		setToggling(id);
		try {
			await apiClient.patch(`/api/vouchers/${id}`);
			setVouchers((prev) =>
				prev.map((v) => (v.id === id ? { ...v, status: "Inactive" } : v))
			);
			setDeactivating(null);
			refreshSummary();
			successToast("Voucher deactivated.");
		} catch {
			errorToast("Failed to deactivate voucher");
		} finally {
			setToggling(null);
		}
	};

	// ── Activate ───────────────────────────────────────────────────────────────

	const handleActivate = async (id: number) => {
		setToggling(id);
		try {
			await apiClient.patch(`/api/vouchers/${id}`);
			setVouchers((prev) =>
				prev.map((v) => (v.id === id ? { ...v, status: "Active" } : v))
			);
			refreshSummary();
			successToast("Voucher activated.");
		} catch {
			errorToast("Failed to activate voucher");
		} finally {
			setToggling(null);
		}
	};

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<section className="space-y-6 w-full">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						Vouchers & Promo Codes
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Create and manage promotional codes
					</p>
				</div>
				<button
					onClick={openCreate}
					className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors shadow-sm self-start sm:self-auto"
				>
					<Plus className="h-4 w-4" />
					Create Voucher
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					icon={<Gift className="h-5 w-5" />}
					iconBg="#ede9fe"
					iconColor="#7c3aed"
					label="Active Vouchers"
					value={String(summary?.active_vouchers ?? 0)}
					loading={loading && !summary}
				/>
				<StatCard
					icon={<BarChart2 className="h-5 w-5" />}
					iconBg="#dbeafe"
					iconColor="#2563eb"
					label="Total Redemptions"
					value={(summary?.total_redemptions ?? 0).toLocaleString()}
					loading={loading && !summary}
				/>
				<StatCard
					icon={<DollarSign className="h-5 w-5" />}
					iconBg="#dcfce7"
					iconColor="#16a34a"
					label="Revenue Impact"
					value={fmtRevenue(summary?.revenue_impact ?? 0)}
					loading={loading && !summary}
				/>
				<StatCard
					icon={<Clock className="h-5 w-5" />}
					iconBg="#fee2e2"
					iconColor="#dc2626"
					label="Expiring Soon"
					value={String(summary?.expiring_soon ?? 0)}
					loading={loading && !summary}
				/>
			</div>

			{/* Table */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 overflow-hidden pb-4">
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
					<h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
						All Vouchers
					</h3>
					<span className="text-[12px] text-slate-400">
						{loading ? "Loading…" : `${vouchers.length} voucher${vouchers.length !== 1 ? "s" : ""}`}
					</span>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-215">
						<thead>
							<tr className="border-b border-slate-100 dark:border-slate-800">
								{["CODE", "DISCOUNT", "TYPE", "USAGE", "EXPIRES", "STATUS", "ACTIONS"].map(
									(h) => (
										<th
											key={h}
											className="px-6 py-3 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase"
										>
											{h}
										</th>
									)
								)}
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[...Array(4)].map((_, i) => <RowSkeleton key={i} />)
							) : vouchers.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className="py-16 text-center text-[14px] text-slate-400"
									>
										No vouchers yet. Create one to get started.
									</td>
								</tr>
							) : (
								vouchers.map((v) => (
									<tr
										key={v.id}
										className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
									>
										{/* Code */}
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												<div className="bg-[#F3F4F6] text-[13px] font-bold text-[#2D3748] px-1 rounded-xs dark:text-slate-100 tracking-wide">
													<span>{v.code}</span>
												</div>
												<button
													onClick={() => copyCode(v.id, v.code)}
													className="text-slate-300 hover:text-slate-500 transition-colors dark:text-slate-600 dark:hover:text-slate-400"
													title="Copy code"
												>
													{copied === v.id ? (
														<Check className="h-3.5 w-3.5 text-emerald-500" />
													) : (
														<Copy className="text-[#718096] h-3.5 w-3.5" />
													)}
												</button>
											</div>
										</td>

										{/* Discount */}
										<td className="px-6 py-4 text-[13px] font-bold text-emerald-500">
											{v.type === "%" ? `${v.discount}%` : `$${v.discount}`}
										</td>

										{/* Type */}
										<td className="px-6 py-4 text-[13px] text-slate-500 dark:text-slate-400">
											{v.type === "%" ? "Percentage" : "Fixed"}
										</td>

										{/* Usage bar */}
										<td className="px-6 py-4">
											<UsageBar used={v.usage.used} limit={v.usage.limit} />
										</td>

										{/* Expires */}
										<td className="px-6 py-4 text-[12px] text-slate-400 whitespace-nowrap">
											{fmtDate(v.expires)}
										</td>

										{/* Status */}
										<td className="px-6 py-4">
											<StatusBadge status={v.status} />
										</td>

										{/* Actions */}
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												<button
													onClick={() => openEdit(v)}
													className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
												>
													<Pencil className="h-3 w-3" />
													Edit
												</button>
												{v.status === "Active" ? (
													<button
														onClick={() => setDeactivating(v)}
														disabled={toggling === v.id}
														className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-100 hover:border-red-200 transition-colors disabled:opacity-50 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
													>
														{toggling === v.id ? (
															<Loader2 className="h-3 w-3 animate-spin" />
														) : null}
														Deactivate
													</button>
												) : (
													<button
														onClick={() => handleActivate(v.id)}
														disabled={toggling === v.id}
														className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-colors disabled:opacity-50 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
													>
														{toggling === v.id ? (
															<Loader2 className="h-3 w-3 animate-spin" />
														) : null}
														Activate
													</button>
												)}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Create / Edit Modal */}
			{modalForm && (
				<VoucherModal
					initial={modalForm}
					onClose={() => setModalForm(null)}
					onSave={handleSave}
					saving={saving}
					planOptions={planOptions}
				/>
			)}

			{/* Deactivate Confirm Modal */}
			{deactivating && (
				<DeactivateModal
					voucher={deactivating}
					onCancel={() => setDeactivating(null)}
					onConfirm={handleDeactivate}
					loading={toggling === deactivating.id}
				/>
			)}
		</section>
	);
};

export default VouchersPage;
