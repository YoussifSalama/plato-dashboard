"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Settings,
	Bell,
	ShieldAlert,
	Eye,
	EyeOff,
	Check,
	X,
	Lock,
	Mail,
	Loader2,
} from "lucide-react";
import clsx from "clsx";
import { apiClient } from "@/lib/apiClient";
import { successToast, errorToast } from "@/shared/helper/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsData = {
	platform_name: string;
	support_email: string;
	email_notifications: boolean;
	new_user_alerts: boolean;
	payment_alerts: boolean;
	admin_email: string;
	password_last_changed_at: string | null;
};

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle = ({
	checked,
	onChange,
	disabled,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
	disabled?: boolean;
}) => (
	<button
		type="button"
		onClick={() => !disabled && onChange(!checked)}
		disabled={disabled}
		className={clsx(
			"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
			checked ? "bg-[#005ca9]" : "bg-slate-200 dark:bg-slate-700"
		)}
	>
		<span
			className={clsx(
				"inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
				checked ? "translate-x-6" : "translate-x-1"
			)}
		/>
	</button>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({
	icon,
	iconBg,
	iconColor,
	title,
	subtitle,
	loading,
	children,
}: {
	icon: React.ReactNode;
	iconBg: string;
	iconColor: string;
	title: string;
	subtitle: string;
	loading?: boolean;
	children: React.ReactNode;
}) => (
	<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 p-6">
		<div className="flex items-center gap-3 mb-6">
			<div
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
				style={{ backgroundColor: iconBg }}
			>
				<span style={{ color: iconColor }}>{icon}</span>
			</div>
			<div>
				<h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
					{title}
				</h3>
				<p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
					{subtitle}
				</p>
			</div>
		</div>
		{loading ? (
			<div className="space-y-5">
				{[1, 2].map((i) => (
					<div
						key={i}
						className="flex items-center justify-between border-b border-slate-50 pb-5 last:border-0 last:pb-0 dark:border-slate-800/60"
					>
						<div className="space-y-1.5">
							<div className="h-4 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
							<div className="h-3 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
						</div>
						<div className="h-8 w-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
					</div>
				))}
			</div>
		) : (
			<div className="space-y-5">{children}</div>
		)}
	</div>
);

// ─── Setting Row ──────────────────────────────────────────────────────────────

const SettingRow = ({
	label,
	description,
	children,
}: {
	label: string;
	description?: React.ReactNode;
	children: React.ReactNode;
}) => (
	<div className="flex items-center justify-between gap-6 border-b border-slate-50 pb-5 last:border-0 last:pb-0 dark:border-slate-800/60">
		<div>
			<p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
				{label}
			</p>
			{description && (
				<p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
					{description}
				</p>
			)}
		</div>
		<div className="shrink-0">{children}</div>
	</div>
);

// ─── Password Input ───────────────────────────────────────────────────────────

const PasswordInput = ({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) => {
	const [show, setShow] = useState(false);
	return (
		<div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-colors dark:border-slate-700 dark:bg-slate-800">
			<input
				type={show ? "text" : "password"}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none dark:text-slate-100"
			/>
			<button
				type="button"
				onClick={() => setShow((p) => !p)}
				className="pr-3 text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-300"
			>
				{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
};

// ─── Password Rule ────────────────────────────────────────────────────────────

const PasswordRule = ({ ok, label }: { ok: boolean; label: string }) => (
	<div className="flex items-center gap-1.5">
		{ok ? (
			<Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
		) : (
			<X className="h-3.5 w-3.5 text-slate-300 shrink-0 dark:text-slate-600" />
		)}
		<span
			className={clsx(
				"text-[12px]",
				ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
			)}
		>
			{label}
		</span>
	</div>
);

// ─── Update Email Modal ───────────────────────────────────────────────────────

const UpdateEmailModal = ({
	currentEmail,
	onClose,
	onSave,
}: {
	currentEmail: string;
	onClose: () => void;
	onSave: (email: string) => Promise<void>;
}) => {
	const [email, setEmail] = useState("");
	const [saving, setSaving] = useState(false);
	const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email !== currentEmail;

	const handleSave = async () => {
		if (!isValid) return;
		setSaving(true);
		try {
			await onSave(email);
		} catch {
			// error already toasted in onSave; modal stays open
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800 mx-4">
				<div className="flex items-center gap-3 px-6 pt-6 pb-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40">
						<Mail className="h-5 w-5 text-[#005ca9]" />
					</div>
					<div>
						<h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">
							Update Email
						</h2>
						<p className="text-[11px] text-slate-400 mt-0.5">
							Change your admin account email address
						</p>
					</div>
				</div>

				<div className="px-6 pb-6 space-y-4">
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							New Email Address
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter new email address"
							className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
						/>
					</div>
					<p className="text-[12px] text-slate-400">
						Current email:{" "}
						<span className="font-semibold text-slate-600 dark:text-slate-300">
							{currentEmail}
						</span>
					</p>
					<div className="flex items-center justify-end gap-2 pt-1">
						<button
							onClick={onClose}
							disabled={saving}
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
						>
							Cancel
						</button>
						<button
							disabled={!isValid || saving}
							onClick={handleSave}
							className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
							Update Email
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Change Password Modal ────────────────────────────────────────────────────

const ChangePasswordModal = ({
	onClose,
	onSave,
}: {
	onClose: () => void;
	onSave: (current: string, next: string) => Promise<void>;
}) => {
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [saving, setSaving] = useState(false);

	const has8 = next.length >= 8;
	const hasUpper = /[A-Z]/.test(next);
	const hasNum = /[0-9]/.test(next);
	const canSubmit = current && has8 && hasUpper && hasNum && next === confirm;

	const handleSave = async () => {
		if (!canSubmit) return;
		setSaving(true);
		try {
			await onSave(current, next);
		} catch {
			// error already toasted in onSave; modal stays open
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800 mx-4">
				<div className="flex items-center gap-3 px-6 pt-6 pb-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
						<ShieldAlert className="h-5 w-5 text-amber-500" />
					</div>
					<div>
						<h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">
							Change Password
						</h2>
						<p className="text-[11px] text-slate-400 mt-0.5">
							Update your admin account password
						</p>
					</div>
				</div>

				<div className="px-6 pb-6 space-y-4">
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Current Password
						</label>
						<div className="mt-1.5">
							<PasswordInput value={current} onChange={setCurrent} placeholder="Enter current password" />
						</div>
					</div>
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							New Password
						</label>
						<div className="mt-1.5">
							<PasswordInput value={next} onChange={setNext} placeholder="Enter new password (min 8 characters)" />
						</div>
					</div>
					<div>
						<label className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
							Confirm New Password
						</label>
						<div className="mt-1.5">
							<PasswordInput value={confirm} onChange={setConfirm} placeholder="Re-enter new password" />
						</div>
					</div>

					<div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 dark:border-slate-800 dark:bg-slate-800/50">
						<p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
							Password must contain:
						</p>
						<PasswordRule ok={has8} label="At least 8 characters" />
						<PasswordRule ok={hasUpper} label="One uppercase letter" />
						<PasswordRule ok={hasNum} label="One number" />
					</div>

					<div className="flex items-center justify-end gap-2 pt-1">
						<button
							onClick={onClose}
							disabled={saving}
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
						>
							Cancel
						</button>
						<button
							disabled={!canSubmit || saving}
							onClick={handleSave}
							className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
							Update Password
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPasswordAge(iso: string | null): string {
	if (!iso) return "Not recently changed";
	const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
	if (days === 0) return "Changed today";
	if (days === 1) return "Changed yesterday";
	return `Last changed ${days} days ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SettingsPage = () => {
	const [loading, setLoading] = useState(true);

	// General
	const [platformName, setPlatformName] = useState("");
	const [supportEmail, setSupportEmail] = useState("");

	// Notifications
	const [emailNotifications, setEmailNotifications] = useState(true);
	const [newUserAlerts, setNewUserAlerts] = useState(true);
	const [paymentAlerts, setPaymentAlerts] = useState(true);

	// Admin account
	const [adminEmail, setAdminEmail] = useState("");
	const [passwordLastChanged, setPasswordLastChanged] = useState<string | null>(null);

	// Modals
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showEmailModal, setShowEmailModal] = useState(false);

	// Save
	const [saving, setSaving] = useState(false);

	// ── Load settings ─────────────────────────────────────────────────────────

	const loadSettings = useCallback(async () => {
		setLoading(true);
		try {
			const res = await apiClient.get("/api/admin/settings");
			const d: SettingsData = res.data.data;
			setPlatformName(d.platform_name);
			setSupportEmail(d.support_email);
			setEmailNotifications(d.email_notifications);
			setNewUserAlerts(d.new_user_alerts);
			setPaymentAlerts(d.payment_alerts);
			setAdminEmail(d.admin_email);
			setPasswordLastChanged(d.password_last_changed_at);
		} catch {
			errorToast("Failed to load settings");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	// ── Save all settings ─────────────────────────────────────────────────────

	const handleSaveAll = async () => {
		setSaving(true);
		try {
			await apiClient.put("/api/admin/settings", {
				platform_name: platformName,
				support_email: supportEmail,
				email_notifications: emailNotifications,
				new_user_alerts: newUserAlerts,
				payment_alerts: paymentAlerts,
			});
			successToast("Settings saved successfully.");
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message ?? "Failed to save settings";
			errorToast(msg);
		} finally {
			setSaving(false);
		}
	};

	// ── Update email ──────────────────────────────────────────────────────────

	const handleUpdateEmail = async (newEmail: string) => {
		try {
			await apiClient.put("/api/admin/me/email", { email: newEmail });
			setAdminEmail(newEmail);
			setShowEmailModal(false);
			successToast("Email updated successfully.");
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message ?? "Failed to update email";
			errorToast(msg);
			throw err; // keep modal open on failure
		}
	};

	// ── Change password ───────────────────────────────────────────────────────

	const handleChangePassword = async (currentPwd: string, newPwd: string) => {
		try {
			await apiClient.put("/api/admin/me/password", {
				current_password: currentPwd,
				new_password: newPwd,
			});
			setPasswordLastChanged(new Date().toISOString());
			setShowPasswordModal(false);
			successToast("Password changed successfully.");
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message ?? "Failed to change password";
			errorToast(msg);
			throw err; // keep modal open on failure
		}
	};

	return (
		<section className="space-y-5 w-full">
			{/* Header */}
			<div className="px-2">
				<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
					Settings
				</h2>
				<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
					Manage platform settings and configurations
				</p>
			</div>

			{/* General Settings */}
			<Section
				icon={<Settings className="h-5 w-5" />}
				iconBg="#dbeafe"
				iconColor="#2563eb"
				title="General Settings"
				subtitle="Configure core platform preferences"
				loading={loading}
			>
				<SettingRow label="Platform Name" description="Display name for the platform">
					<input
						value={platformName}
						onChange={(e) => setPlatformName(e.target.value)}
						className="text-left w-56 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					/>
				</SettingRow>
				<SettingRow label="Support Email" description="Email for user support">
					<input
						value={supportEmail}
						onChange={(e) => setSupportEmail(e.target.value)}
						className="text-left w-56 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					/>
				</SettingRow>
			</Section>

			{/* Notification Settings */}
			<Section
				icon={<Bell className="h-5 w-5" />}
				iconBg="#ede9fe"
				iconColor="#7c3aed"
				title="Notification Settings"
				subtitle="Configure notification preferences"
				loading={loading}
			>
				<SettingRow
					label="Email Notifications"
					description="Send email alerts for important events"
				>
					<Toggle
						checked={emailNotifications}
						onChange={setEmailNotifications}
						disabled={loading}
					/>
				</SettingRow>
				<SettingRow
					label="New User Alerts"
					description="Notify when new users register"
				>
					<Toggle
						checked={newUserAlerts}
						onChange={setNewUserAlerts}
						disabled={loading}
					/>
				</SettingRow>
				<SettingRow
					label="Payment Alerts"
					description="Notify about subscription payments"
				>
					<Toggle
						checked={paymentAlerts}
						onChange={setPaymentAlerts}
						disabled={loading}
					/>
				</SettingRow>
			</Section>

			{/* Admin Account */}
			<Section
				icon={<Lock className="h-5 w-5" />}
				iconBg="#fef3c7"
				iconColor="#d97706"
				title="Admin Account"
				subtitle="Manage your admin account settings"
				loading={loading}
			>
				<SettingRow
					label="Admin Email"
					description={loading ? "Loading…" : adminEmail}
				>
					<button
						onClick={() => setShowEmailModal(true)}
						disabled={loading}
						className="text-[13px] font-semibold text-[#005ca9] hover:text-[#004e8f] transition-colors disabled:opacity-50"
					>
						Update Email
					</button>
				</SettingRow>
				<SettingRow
					label="Password"
					description={loading ? "Loading…" : fmtPasswordAge(passwordLastChanged)}
				>
					<button
						onClick={() => setShowPasswordModal(true)}
						disabled={loading}
						className="text-[13px] font-semibold text-[#005ca9] hover:text-[#004e8f] transition-colors disabled:opacity-50"
					>
						Change Password
					</button>
				</SettingRow>
			</Section>

			{/* Save button */}
			<div className="flex justify-end pb-2">
				<button
					onClick={handleSaveAll}
					disabled={saving || loading}
					className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
				>
					{saving && <Loader2 className="h-4 w-4 animate-spin" />}
					{saving ? "Saving..." : "Save All Settings"}
				</button>
			</div>

			{/* Change Password Modal */}
			{showPasswordModal && (
				<ChangePasswordModal
					onClose={() => setShowPasswordModal(false)}
					onSave={handleChangePassword}
				/>
			)}

			{/* Update Email Modal */}
			{showEmailModal && (
				<UpdateEmailModal
					currentEmail={adminEmail}
					onClose={() => setShowEmailModal(false)}
					onSave={handleUpdateEmail}
				/>
			)}
		</section>
	);
};

export default SettingsPage;
