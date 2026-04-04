"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
	sidebarRoutes,
	bottomRoutes,
} from "@/shared/core/layout/sidebar/routes";
// import useInboxStore from "@/shared/store/pages/inbox/useInboxStore";
// import useAgency from "@/shared/store/useAgency";
// import useAgencyStore from "@/shared/store/pages/agency/useAgencyStore";
import useAuthStore from "@/shared/store/pages/auth/useAuthStore";
import { useState } from "react";

const getInitials = (name?: string | null) => {
	if (!name) return "AC";
	const parts = name.trim().split(/\s+/).filter(Boolean);
	const first = parts[0]?.[0] ?? "";
	const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
	return `${first}${second}`.toUpperCase() || "AC";
};

const Sidebar = ({
	isOpen,
	isCollapsed,
	onToggleSidebar,
}: {
	isOpen: boolean;
	isCollapsed: boolean;
	onToggleSidebar: () => void;
}) => {
	const pathname = usePathname();
	const account = {
		name: "Raef Alwani",
		email: "raef@gmail.com",
		is_member: true,
	};
	// const { unreadCount, getUnreadNotifications } = useInboxStore();
	const unreadCount = 12;
	// const { account } = useAgency();
	// const { getOverview } = useAgencyStore();
	const [agencyName, setAgencyName] = useState("Super Admin");

	return (
		<aside
			className={clsx(
				"fixed inset-y-0 z-40 w-72 transition-transform duration-300 flex flex-col rounded-2xl m-3",
				"lg:fixed lg:top-0",
				"border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
			)}
		>
			<div className="relative flex items-center justify-between pl-8 pr-6 py-8 flex-none">
				<Link href="/" className="flex items-center gap-3">
					<div className="relative">
						<img
							src="/brand/plato-logo.png"
							alt="Plato logo"
							className="h-10 w-10 object-contain"
							width={40}
							height={40}
						/>
						<span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-[2.5px] border-white bg-[#10b981] dark:border-slate-950" />
					</div>
					<div className="flex flex-col">
						<span className="text-[22px] font-bold text-[#2D3748] dark:text-white leading-none tracking-tight">
							Plato
						</span>
						<span className="text-[12px] font-medium text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
							{agencyName}
						</span>
					</div>
				</Link>
			</div>

			<div className="flex-1 overflow-y-auto mt-2 flex flex-col hide-scrollbar">
				<nav className="flex flex-col gap-1.5 flex-none">
					{sidebarRoutes.map((route) => {
						let isActive =
							pathname === route.href ||
							pathname?.startsWith(`${route.href}/`) ||
							(route.href === "/jobs" && pathname?.startsWith("/job/"));

						if (
							route.href === "/resumes" &&
							pathname?.startsWith("/resumes/analyse")
						) {
							isActive = false;
						}

						const Icon = route.icon;

						return (
							<Link
								key={route.href}
								href={route.href.includes("/none") ? `${pathname}` : route.href}
								className={clsx(
									"group flex items-center gap-4 py-3.5 text-[15px] font-medium transition-colors relative mx-6 rounded-[20px] pl-8",
									isActive
										? "bg-[#005ca9] text-white shadow-sm"
										: "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-slate-100"
								)}
							>
								<div className="relative flex items-center justify-center">
									<Icon className="h-5 w-5" strokeWidth={2.2} />
									{route.label === "Inbox" && unreadCount > 0 && (
										<span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-red-500 dark:border-slate-950" />
									)}
								</div>
								<span>{route.label}</span>
								{route.label === "Inbox" && unreadCount > 0 && (
									<span className="ml-auto mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
										{unreadCount > 99 ? "99+" : unreadCount}
									</span>
								)}
							</Link>
						);
					})}
				</nav>

				<div className="mt-auto px-8 py-6 flex-none">
					<hr className="mb-6 border-slate-200 dark:border-slate-800" />
					<nav className="flex flex-col gap-3">
						{bottomRoutes.map((route) => {
							const Icon = route.icon;
							return (
								<Link
									key={route.href}
									href={
										route.href.includes("/none") ? `${pathname}` : route.href
									}
									className={clsx(
										"group flex items-center gap-4 py-3.5 text-[15px] font-medium transition-colors relative rounded-[20px] pl-8",
										pathname === route.href
											? "bg-[#005ca9] text-white shadow-sm"
											: "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-slate-100"
									)}
								>
									<Icon className="h-5 w-5" strokeWidth={2.2} />
									<span>{route.label}</span>
								</Link>
							);
						})}
					</nav>
				</div>
			</div>

			{/* <div className="px-6 pb-6 pt-2 flex-none">
				<div className="flex flex-col gap-4 rounded-[20px] bg-[#005ca9] p-4 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="relative flex h-11 w-11 items-center justify-center rounded-[12px] bg-white font-bold text-[#005ca9] text-[15px] shrink-0">
							{initials}
							<span className="absolute -bottom-1 -right-1 h-[14px] w-[14px] rounded-full border-[2.5px] border-[#005ca9] bg-[#10b981]" />
						</div>
						<div className="flex flex-col overflow-hidden">
							<span className="truncate text-[14px] font-bold text-white tracking-wide">
								{account?.name ?? "Account"}
							</span>
							<span className="truncate text-[12px] text-blue-200 mt-0.5">
								{account?.email ?? ""}
							</span>
						</div>
					</div>
					<button
						onClick={logout}
						className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white py-2.5 text-[14px] font-semibold text-[#005ca9] transition-all hover:bg-slate-50 hover:text-[#004e8f] shadow-sm dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700 dark:hover:text-blue-200"
					>
						<LogOut className="h-[18px] w-[18px]" strokeWidth={2.5} />
						Sign out
					</button>
				</div>
			</div> */}
		</aside>
	);
};

export default Sidebar;
