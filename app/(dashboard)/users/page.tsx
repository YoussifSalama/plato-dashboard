"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import UserTable, {
	type UserListItem,
} from "@/shared/components/pages/user/UserTable";
import PaginationBar from "@/shared/common/features/PaginationBar";
import {
	Search,
	Plus,
	Filter,
	ChevronDown,
	Check,
	Building2,
	User,
	Users,
	Mail,
	Phone,
	MapPin,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";
import { apiClient } from "@/lib/apiClient";
import { errorToast, successToast } from "@/shared/helper/toast";
import { resolveErrorMessage } from "@/shared/helper/apiMessages";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserFilterState = {
	partial_matching: string;
	page: number;
	status: "all" | "active" | "blocked";
	type: "all" | "company" | "candidate";
};

type NewUserForm = {
	name: string;
	email: string;
	phone: string;
	location: string;
	subscription_plan: string;
	password: string;
	type: "company" | "candidate";
	send_welcome_email: boolean;
	activate_immediately: boolean;
	verify_automatically: boolean;
};

type EditUserForm = {
	f_name: string;
	l_name: string;
	email: string;
	verified: boolean;
};

type ApiUser = {
	id: number;
	type: "company" | "candidate";
	name: string;
	email: string | null;
	status: boolean;
	created_at: string;
	activity: number;
};

function mapToListItem(u: ApiUser): UserListItem {
	return {
		id: u.id,
		name: u.name,
		email: u.email ?? "",
		type: u.type,
		status: u.status ? "active" : "blocked",
		joined_at: u.created_at,
		activity_count: u.activity,
	};
}

// ─── Component ────────────────────────────────────────────────────────────────

const EMPTY_FORM: NewUserForm = {
	name: "",
	email: "",
	phone: "",
	location: "",
	subscription_plan: "",
	password: "",
	type: "company",
	send_welcome_email: false,
	activate_immediately: false,
	verify_automatically: false,
};

const UsersPage = () => {
	// ── Data state ────────────────────────────────────────────────────────────
	const [users, setUsers] = useState<UserListItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [totalCompanies, setTotalCompanies] = useState(0);
	const [totalCandidates, setTotalCandidates] = useState(0);

	// ── Filter state ──────────────────────────────────────────────────────────
	const [filters, setFilters] = useState<UserFilterState>({
		partial_matching: "",
		page: 1,
		status: "all",
		type: "all",
	});

	// ── Add modal state ───────────────────────────────────────────────────────
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);

	// ── Edit modal state ──────────────────────────────────────────────────────
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
	const [editForm, setEditForm] = useState<EditUserForm>({
		f_name: "",
		l_name: "",
		email: "",
		verified: false,
	});
	const [editSubmitting, setEditSubmitting] = useState(false);

	// ── Fetch ─────────────────────────────────────────────────────────────────
	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await apiClient.get<{
				data: {
					total_companies: number;
					total_candidates: number;
					users: ApiUser[];
				};
			}>("/api/user");
			const {
				users: apiUsers,
				total_companies,
				total_candidates,
			} = res.data.data;
			setUsers(apiUsers.map(mapToListItem));
			setTotalCompanies(total_companies);
			setTotalCandidates(total_candidates);
		} catch (err) {
			errorToast(resolveErrorMessage(err, "Failed to load users."));
		} finally {
			setLoading(false);
			setHasLoaded(true);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	// ── Handlers ──────────────────────────────────────────────────────────────
	const handleAddUser = async (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			const {
				type,
				name,
				email,
				phone,
				location,
				subscription_plan,
				password,
			} = form;

			const common = {
				email,
				phone: phone || undefined,
				password,
				send_welcome_email: form.send_welcome_email,
				activate_immediately: form.activate_immediately,
				verify_immediately: form.verify_automatically,
			};

			const payload =
				type === "company"
					? {
							...common,
							name,
							location: location || undefined,
							plan: subscription_plan || undefined,
						}
					: {
							...common,
							f_name: name.split(" ")[0],
							l_name: name.split(" ").slice(1).join(" ") || name.split(" ")[0],
						};

			await apiClient.post(`/api/user/${type}`, payload);
			successToast("User created successfully.");
			setAddModalOpen(false);
			setForm(EMPTY_FORM);
			await fetchUsers();
		} catch (err) {
			errorToast(resolveErrorMessage(err, "Failed to create user."));
		} finally {
			setSubmitting(false);
		}
	};

	const handleOpenEdit = (user: UserListItem) => {
		const parts = user.name.trim().split(" ");
		setEditingUser(user);
		setEditForm({
			f_name: parts[0] ?? "",
			l_name: parts.slice(1).join(" "),
			email: user.email,
			verified: user.status === "active",
		});
		setEditModalOpen(true);
	};

	const handleEditUser = async (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingUser) return;
		setEditSubmitting(true);
		try {
			await apiClient.patch(`/api/user/${editingUser.type}/${editingUser.id}`, {
				email: editForm.email,
				f_name: editForm.f_name,
				l_name: editForm.l_name || undefined,
				verified: editForm.verified,
			});
			successToast("User updated.");
			setEditModalOpen(false);
			setEditingUser(null);
			await fetchUsers();
		} catch (err) {
			errorToast(resolveErrorMessage(err, "Failed to update user."));
		} finally {
			setEditSubmitting(false);
		}
	};

	const handleDelete = async (userId: number) => {
		const user = users.find((u) => u.id === userId);
		if (!user) return;
		try {
			await apiClient.delete(`/api/user/${user.type}/${userId}`);
			setUsers((prev) => prev.filter((u) => u.id !== userId));
			successToast("User deleted.");
		} catch (err) {
			errorToast(resolveErrorMessage(err, "Failed to delete user."));
		}
	};

	const handleBlock = async (user: UserListItem) => {
		const newVerified = user.status !== "active";
		try {
			await apiClient.patch(`/api/user/${user.type}/${user.id}`, {
				verified: newVerified,
			});
			setUsers((prev) =>
				prev.map((u) =>
					u.id === user.id
						? { ...u, status: newVerified ? "active" : "blocked" }
						: u
				)
			);
			successToast(newVerified ? "User activated." : "User blocked.");
		} catch (err) {
			errorToast(resolveErrorMessage(err, "Failed to update user status."));
		}
	};

	// ── Derived ───────────────────────────────────────────────────────────────
	const PAGE_SIZE = 10;

	const filteredUsers = users.filter((u) => {
		const matchesSearch =
			!filters.partial_matching ||
			u.name.toLowerCase().includes(filters.partial_matching.toLowerCase()) ||
			u.email.toLowerCase().includes(filters.partial_matching.toLowerCase());
		const matchesStatus =
			filters.status === "all" || u.status === filters.status;
		const matchesType = filters.type === "all" || u.type === filters.type;
		return matchesSearch && matchesStatus && matchesType;
	});

	const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
	const safePage = Math.min(filters.page, totalPages);
	const pagedUsers = filteredUsers.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE
	);

	const labelClass =
		"block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5";
	const inputClass =
		"w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#005ca9] focus:ring-2 focus:ring-[#005ca9]/10 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
	const iconInputClass =
		"flex items-center gap-2.5 rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-[#005ca9] focus-within:ring-2 focus-within:ring-[#005ca9]/10 transition dark:border-slate-700 dark:bg-slate-800";

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<section className="space-y-6 mx-auto w-full">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 px-2">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						User Management
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Manage companies and candidates
					</p>
				</div>
				<Button
					onClick={() => setAddModalOpen(true)}
					className={clsx(
						"rounded-[10px] bg-[#005ca9] text-[14px] font-semibold text-white hover:bg-[#004e8f] h-10 px-4 transition-colors shadow-sm"
					)}
				>
					<Plus className="h-4 w-4 stroke-[2.5] mr-1.5" />
					Add New User
				</Button>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-3 gap-4">
				{[
					{
						label: "Total Users",
						value: totalCompanies + totalCandidates,
						icon: <Users className="h-5 w-5 text-white" />,
						iconBg: "bg-[#005ca9]",
					},
					{
						label: "Companies",
						value: totalCompanies,
						icon: <Building2 className="h-5 w-5 text-white" />,
						iconBg: "bg-[#905DF8]",
					},
					{
						label: "Candidates",
						value: totalCandidates,
						icon: <User className="h-5 w-5 text-white" />,
						iconBg: "bg-[#48BB78]",
					},
				].map(({ label, value, icon, iconBg }) => (
					<div
						key={label}
						className="flex items-center justify-between rounded-[16px] bg-white border border-slate-100 px-5 py-8 shadow-xs dark:border-slate-800 dark:bg-slate-950"
					>
						<div className="flex flex-col gap-1">
							<span className="text-[12px] font-medium text-slate-400">
								{label}
							</span>
							<span className="text-[25px] font-bold text-[#2D3748] leading-tight dark:text-slate-100">
								{loading ? "—" : value.toLocaleString()}
							</span>
						</div>
						<span
							className={clsx(
								"flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px]",
								iconBg
							)}
						>
							{icon}
						</span>
					</div>
				))}
			</div>

			{/* Search + Filters bar */}
			<div className="rounded-[20px] bg-white p-3 shadow-xs border border-slate-100 flex flex-col md:flex-row items-center gap-4 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
				<div className="flex-1 flex items-center gap-3 px-4 py-2 w-full">
					<Search className="h-5 w-5 text-slate-400" />
					<input
						type="text"
						placeholder="Search users by name or email..."
						className="w-full bg-transparent text-[14px] font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal outline-none dark:text-slate-200"
						value={filters.partial_matching}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								partial_matching: e.target.value,
								page: 1,
							}))
						}
					/>
				</div>
				<div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
				<div className="flex items-center gap-3 px-2 w-full md:w-auto overflow-x-auto hide-scrollbar">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900">
						<Filter className="h-4 w-4 stroke-[2.5]" />
					</div>

					{/* Status filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex h-10 shrink-0 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2 cursor-pointer hover:bg-slate-100 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800">
								<div className="flex flex-col">
									<span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
										Status
									</span>
									<span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 leading-tight capitalize">
										{filters.status === "all" ? "All Status" : filters.status}
									</span>
								</div>
								<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[160px] rounded-2xl p-2 dark:bg-slate-900 dark:border-slate-800"
						>
							{(["all", "active", "blocked"] as const).map((s) => (
								<DropdownMenuItem
									key={s}
									onClick={() =>
										setFilters((prev) => ({ ...prev, status: s, page: 1 }))
									}
									className="cursor-pointer rounded-[8px] flex items-center justify-between capitalize"
								>
									{s === "all" ? "All" : s}
									{filters.status === s && (
										<Check className="h-4 w-4 text-blue-500" />
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Type filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex h-10 shrink-0 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2 cursor-pointer hover:bg-slate-100 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800">
								<div className="flex flex-col">
									<span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
										Type
									</span>
									<span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 leading-tight capitalize">
										{filters.type === "all" ? "All Types" : filters.type}
									</span>
								</div>
								<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[160px] rounded-2xl p-2 dark:bg-slate-900 dark:border-slate-800"
						>
							{(["all", "company", "candidate"] as const).map((t) => (
								<DropdownMenuItem
									key={t}
									onClick={() =>
										setFilters((prev) => ({ ...prev, type: t, page: 1 }))
									}
									className="cursor-pointer rounded-[8px] flex items-center justify-between capitalize"
								>
									{t === "all" ? "All" : t}
									{filters.type === t && (
										<Check className="h-4 w-4 text-blue-500" />
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-[20px] bg-white shadow-xs border border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none overflow-hidden pb-4">
				<UserTable
					users={pagedUsers}
					loading={loading}
					hasLoaded={hasLoaded}
					onEdit={handleOpenEdit}
					onBlock={handleBlock}
					onDelete={handleDelete}
				/>
				<div className="mt-4 px-2 border-t border-slate-100 pt-4 dark:border-slate-800">
					<PaginationBar
						currentPage={safePage}
						totalPages={totalPages}
						totalItems={filteredUsers.length}
						itemName="users"
						pageSize={PAGE_SIZE}
						onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
						className="border-0 shadow-none px-4"
					/>
				</div>
			</div>

			{/* ── Add New User Modal ─────────────────────────────────────────────── */}
			<Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
				<DialogContent className="sm:max-w-130">
					<DialogHeader>
						<DialogTitle>Add New User</DialogTitle>
						<DialogDescription>
							Create a new company or candidate account
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleAddUser} className="mt-4 space-y-5">
						{/* User Type selector */}
						<div>
							<label className={labelClass}>User Type *</label>
							<div className="grid grid-cols-2 gap-3 mt-1">
								{(["company", "candidate"] as const).map((t) => {
									const selected = form.type === t;
									return (
										<button
											key={t}
											type="button"
											onClick={() =>
												setForm((p) => ({
													...p,
													type: t,
													subscription_plan:
														t === "candidate" ? "" : p.subscription_plan,
												}))
											}
											className={clsx(
												"flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all",
												selected
													? "border-[#005ca9] bg-blue-50 dark:bg-blue-950/30"
													: "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
											)}
										>
											<span
												className={clsx(
													"flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
													selected
														? "bg-[#005ca9]/10 text-[#005ca9]"
														: "bg-slate-100 text-slate-400 dark:bg-slate-800"
												)}
											>
												{t === "company" ? (
													<Building2 className="h-4 w-4 stroke-2" />
												) : (
													<User className="h-4 w-4 stroke-2" />
												)}
											</span>
											<span className="flex flex-col">
												<span
													className={clsx(
														"text-[14px] font-semibold",
														selected
															? "text-[#005ca9]"
															: "text-slate-700 dark:text-slate-200"
													)}
												>
													{t === "company" ? "Company" : "Candidate"}
												</span>
												<span className="text-[11px] text-slate-400">
													{t === "company" ? "Business account" : "Job seeker"}
												</span>
											</span>
										</button>
									);
								})}
							</div>
						</div>

						{/* Name + Email */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={labelClass}>Full Name / Company Name *</label>
								<input
									required
									type="text"
									placeholder="e.g., Acme Corp"
									className={inputClass}
									value={form.name}
									onChange={(e) =>
										setForm((p) => ({ ...p, name: e.target.value }))
									}
								/>
							</div>
							<div>
								<label className={labelClass}>Email Address *</label>
								<div className={iconInputClass}>
									<Mail className="h-4 w-4 shrink-0 text-slate-400" />
									<input
										required
										type="email"
										placeholder="email@example.com"
										className="w-full bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 outline-none dark:text-slate-200"
										value={form.email}
										onChange={(e) =>
											setForm((p) => ({ ...p, email: e.target.value }))
										}
									/>
								</div>
							</div>
						</div>

						{/* Phone + Location */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={labelClass}>Phone Number</label>
								<div className={iconInputClass}>
									<Phone className="h-4 w-4 shrink-0 text-slate-400" />
									<input
										type="tel"
										placeholder="+1 (555) 000-0000"
										className="w-full bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 outline-none dark:text-slate-200"
										value={form.phone}
										onChange={(e) =>
											setForm((p) => ({ ...p, phone: e.target.value }))
										}
									/>
								</div>
							</div>
							<div>
								<label className={labelClass}>Location</label>
								<div className={iconInputClass}>
									<MapPin className="h-4 w-4 shrink-0 text-slate-400" />
									<input
										type="text"
										placeholder="City, Country"
										className="w-full bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 outline-none dark:text-slate-200"
										value={form.location}
										onChange={(e) =>
											setForm((p) => ({ ...p, location: e.target.value }))
										}
									/>
								</div>
							</div>
						</div>

						{/* Subscription Plan — company only */}
						{form.type === "company" && (
							<div>
								<label className={labelClass}>Subscription Plan</label>
								<select
									className={inputClass}
									value={form.subscription_plan}
									onChange={(e) =>
										setForm((p) => ({
											...p,
											subscription_plan: e.target.value,
										}))
									}
								>
									<option value="">Select a plan</option>
									{(
										["STARTER", "GROWTH", "PRO", "EXTRA", "CUSTOM"] as const
									).map((plan) => (
										<option key={plan} value={plan}>
											{plan.charAt(0) + plan.slice(1).toLowerCase()} Plan
										</option>
									))}
								</select>
							</div>
						)}

						{/* Password */}
						<div>
							<label className={labelClass}>Password *</label>
							<input
								required
								type="password"
								placeholder="Create a secure password"
								className={inputClass}
								value={form.password}
								onChange={(e) =>
									setForm((p) => ({ ...p, password: e.target.value }))
								}
							/>
							<p className="mt-1.5 text-[11px] text-slate-400">
								Must be at least 8 characters with numbers and symbols
							</p>
						</div>

						{/* Checkboxes */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2.5 dark:border-slate-700 dark:bg-slate-800/50">
							{(
								[
									["send_welcome_email", "Send welcome email to user"],
									["activate_immediately", "Activate account immediately"],
									["verify_automatically", "Verify account automatically"],
								] as const
							).map(([key, label]) => (
								<label
									key={key}
									className="flex items-center gap-2.5 cursor-pointer"
								>
									<input
										type="checkbox"
										checked={form[key]}
										onChange={(e) =>
											setForm((p) => ({ ...p, [key]: e.target.checked }))
										}
										className="h-4 w-4 rounded border-slate-300 accent-[#005ca9] cursor-pointer"
									/>
									<span className="text-[13px] text-slate-600 dark:text-slate-300">
										{label}
									</span>
								</label>
							))}
						</div>

						<DialogFooter className="mt-2 gap-2 sm:gap-0">
							<button
								type="button"
								onClick={() => {
									setAddModalOpen(false);
									setForm(EMPTY_FORM);
								}}
								disabled={submitting}
								className="inline-flex items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={submitting}
								className="inline-flex items-center justify-center ml-3 rounded-[8px] bg-[#005ca9] px-5 py-2 text-[14px] font-semibold text-white hover:bg-[#004e8f] disabled:opacity-50 transition-colors"
							>
								{submitting ? (
									<>
										<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
										Creating...
									</>
								) : (
									"Create User"
								)}
							</button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* ── Edit User Modal ────────────────────────────────────────────────── */}
			<Dialog
				open={editModalOpen}
				onOpenChange={(open) => {
					if (!open) setEditingUser(null);
					setEditModalOpen(open);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit User</DialogTitle>
						<DialogDescription>
							Update details for{" "}
							<span className="font-semibold text-slate-800 dark:text-slate-200">
								{editingUser?.name}
							</span>{" "}
							<span className="capitalize text-slate-500">
								({editingUser?.type})
							</span>
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleEditUser} className="mt-4 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={labelClass}>First Name</label>
								<input
									required
									type="text"
									className={inputClass}
									value={editForm.f_name}
									onChange={(e) =>
										setEditForm((p) => ({ ...p, f_name: e.target.value }))
									}
								/>
							</div>
							<div>
								<label className={labelClass}>Last Name</label>
								<input
									type="text"
									className={inputClass}
									value={editForm.l_name}
									onChange={(e) =>
										setEditForm((p) => ({ ...p, l_name: e.target.value }))
									}
								/>
							</div>
						</div>

						<div>
							<label className={labelClass}>Email Address</label>
							<div className={iconInputClass}>
								<Mail className="h-4 w-4 shrink-0 text-slate-400" />
								<input
									required
									type="email"
									className="w-full bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 outline-none dark:text-slate-200"
									value={editForm.email}
									onChange={(e) =>
										setEditForm((p) => ({ ...p, email: e.target.value }))
									}
								/>
							</div>
						</div>

						<label className="flex items-center gap-2.5 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
							<input
								type="checkbox"
								checked={editForm.verified}
								onChange={(e) =>
									setEditForm((p) => ({ ...p, verified: e.target.checked }))
								}
								className="h-4 w-4 rounded border-slate-300 accent-[#005ca9] cursor-pointer"
							/>
							<span className="text-[13px] text-slate-600 dark:text-slate-300">
								Account verified (active)
							</span>
						</label>

						<DialogFooter className="mt-2 gap-2 sm:gap-0">
							<button
								type="button"
								onClick={() => {
									setEditModalOpen(false);
									setEditingUser(null);
								}}
								disabled={editSubmitting}
								className="inline-flex items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={editSubmitting}
								className="inline-flex items-center justify-center ml-3 rounded-[8px] bg-[#005ca9] px-5 py-2 text-[14px] font-semibold text-white hover:bg-[#004e8f] disabled:opacity-50 transition-colors"
							>
								{editSubmitting ? (
									<>
										<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
										Saving...
									</>
								) : (
									"Save Changes"
								)}
							</button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</section>
	);
};

export default UsersPage;
