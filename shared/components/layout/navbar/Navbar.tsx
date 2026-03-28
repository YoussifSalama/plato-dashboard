import clsx from "clsx";
import {
	ChevronDown,
	LogOut,
	Menu,
	PanelLeftClose,
	PanelLeftOpen,
	Settings,
	User,
	WalletCards,
	Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useAuthStore from "@/shared/store/pages/auth/useAuthStore";
import ThemeSwitch from "@/shared/components/layout/theme/ThemeSwitch";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationMenu from "./NotificationMenu";

const getInitials = (name?: string | null) => {
	if (!name) return "AC";
	const parts = name.trim().split(/\s+/).filter(Boolean);
	const first = parts[0]?.[0] ?? "";
	const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
	return `${first}${second}`.toUpperCase() || "AC";
};

const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
	const account = {
		name: "Raef Alwani",
		email: "raef@gmail.com",
		is_member: true,
	};
	const { logout } = useAuthStore();
	const initials = getInitials(account.name);
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && searchQuery.trim()) {
			router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	return (
		<nav
			className={clsx(
				"flex items-center justify-between rounded-[20px] border border-slate-100 bg-white px-4 py-3 shadow-xs",
				"dark:border-slate-800 dark:bg-slate-950 dark:shadow-none"
			)}
		>
			<div className="flex flex-1 items-center gap-4">
				<button
					type="button"
					onClick={onMenuClick}
					className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
					aria-label="Open sidebar menu"
				>
					<Menu className="h-5 w-5" />
				</button>
				<div className="hidden lg:flex w-full max-w-xl items-center gap-2.5 rounded-[12px] bg-slate-50 px-4 py-2.5 dark:bg-slate-900 border border-transparent dark:border-slate-800 transition-colors focus-within:bg-white focus-within:border-slate-200 focus-within:shadow-sm dark:focus-within:bg-slate-950">
					<Search className="h-[18px] w-[18px] text-slate-400 stroke-[2.5]" />
					<input
						type="text"
						placeholder="Search jobs, candidates, or anything..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={handleSearch}
						className="w-full bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200"
					/>
				</div>
			</div>

			<div className="ml-auto flex shrink-0 items-center gap-6">
				<NotificationMenu />

				<div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800"></div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							suppressHydrationWarning
							type="button"
							className="flex items-center gap-6 text-left transition hover:opacity-80"
						>
							<span className="hidden flex-col items-end text-right sm:flex">
								<span className="flex flex-col items-start gap-1 text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100">
									<span>{account?.name ?? "Account"}</span>
									<span className="text-[#A0AEC0] text-right text-[11px] font-normal leading-[16.5px]">
										Super Admin
									</span>
								</span>
							</span>
							<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#005ca9] font-bold text-white text-[14px]">
								{initials}
								<span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[2.5px] border-white bg-[#10b981] dark:border-slate-950" />
							</div>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-60">
						<DropdownMenuLabel className="text-[#005ca9] dark:text-slate-100">
							{account?.name ?? "Account"}
							<div className="text-xs font-normal text-[#009ad5] dark:text-slate-400">
								{account?.email ?? ""}
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link
								href="/settings/account"
								className="flex items-center gap-2"
							>
								<User className="h-4 w-4" />
								Profile Settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href="/billing" className="flex items-center gap-2">
								<WalletCards className="h-4 w-4" />
								Billing & Credits
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href="/settings" className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								Settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={logout}
							className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
						>
							<LogOut className="h-4 w-4" />
							Sign Out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* <ThemeSwitch /> */}
			</div>
		</nav>
	);
};

export default Navbar;
