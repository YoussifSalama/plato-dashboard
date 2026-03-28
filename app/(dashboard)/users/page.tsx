"use client";

import { useState } from "react";
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
	CircleCheckBig,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";

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

const MOCK_USERS: UserListItem[] = [
	{
		activity_count: 12,
		email: "m.wadia@gmail.com",
		id: 2,
		joined_at: "2026-03-01T14:30:00Z",
		name: "Marian Wadia",
		status: "active",
		type: "company",
	},
	{
		activity_count: 3,
		email: "a.ali@gmail.com",
		id: 4,
		joined_at: "2026-03-01T14:30:00Z",
		name: "Ahmed Ali",
		status: "blocked",
		type: "candidate",
	},
];

const UsersPage = () => {
	const [users] = useState<UserListItem[]>(MOCK_USERS);
	const [filters, setFilters] = useState<UserFilterState>({
		partial_matching: "",
		page: 1,
		status: "all",
		type: "all",
	});

	const [addModalOpen, setAddModalOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
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
	const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);

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

	const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		// TODO: wire up to API
		await new Promise((r) => setTimeout(r, 800));
		setSubmitting(false);
		setAddModalOpen(false);
		setForm(EMPTY_FORM);
	};

	const labelClass =
		"block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5";
	const inputClass =
		"w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#005ca9] focus:ring-2 focus:ring-[#005ca9]/10 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
	const iconInputClass =
		"flex items-center gap-2.5 rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-[#005ca9] focus-within:ring-2 focus-within:ring-[#005ca9]/10 transition dark:border-slate-700 dark:bg-slate-800";

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
						value: 1234,
						icon: <Search className="h-5 w-5 text-white" />,
						iconBg: "bg-[#005ca9]",
					},
					{
						label: "Companies",
						value: 342,
						icon: <CircleCheckBig className="h-5 w-5 text-white" />,
						iconBg: "bg-[#905DF8]",
					},
					{
						label: "Candidates",
						value: 892,
						icon: <CircleCheckBig className="h-5 w-5 text-white" />,
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
								{value.toLocaleString()}
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
					users={filteredUsers}
					loading={false}
					hasLoaded={true}
					onBlock={(user) => {
						// TODO: wire up block/unblock API
						console.log("toggle block", user.id);
					}}
					onDelete={(userId) => {
						// TODO: wire up delete API
						console.log("delete", userId);
					}}
				/>
				{filteredUsers.length > 10 && (
					<div className="mt-4 px-2">
						<PaginationBar
							currentPage={filters.page}
							totalPages={Math.ceil(filteredUsers.length / 10)}
							totalItems={filteredUsers.length}
							itemName="users"
							onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
							className="border-0 shadow-none px-4"
						/>
					</div>
				)}
			</div>

			{/* Add New User Modal */}
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
											onClick={() => setForm((p) => ({ ...p, type: t }))}
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

						{/* Subscription Plan */}
						<div>
							<label className={labelClass}>Subscription Plan</label>
							<input
								type="text"
								placeholder="Pro Plan"
								className={inputClass}
								value={form.subscription_plan}
								onChange={(e) =>
									setForm((p) => ({ ...p, subscription_plan: e.target.value }))
								}
							/>
						</div>

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
								onClick={() => setAddModalOpen(false)}
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
		</section>
	);
};

export default UsersPage;
