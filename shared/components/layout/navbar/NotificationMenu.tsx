"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
	Bell,
	Briefcase,
	Calendar,
	CheckCheck,
	CircleAlert,
	FileText,
	Mail,
	MessageCircleWarning,
} from "lucide-react";
import clsx from "clsx";
import useInboxStore, {
	InboxItem,
	InboxType,
} from "@/shared/store/pages/inbox/useInboxStore";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const resolveIcon = (type: InboxType) => {
	const className = "h-4 w-4 text-blue-600 dark:text-blue-400";
	switch (type) {
		case "new_application":
			return <Briefcase className={className} />;
		case "interview_completed":
			return <Calendar className={className} />;
		case "batch_failed":
			return <FileText className={className} />;
		case "failed_log":
			return <CircleAlert className={clsx(className, "text-red-500")} />;
		default:
			return <Bell className={className} />;
	}
};

const NotificationMenu = () => {
	const {
		recentNotifications,
		unreadCount,
		getUnreadNotifications,
		getRecentNotifications,
		markAllRead,
		loadingNotifications,
	} = useInboxStore();
	const [isOpen, setIsOpen] = useState(false);

	// Initial fetch and polling
	useEffect(() => {
		getUnreadNotifications();
		getRecentNotifications(10); // Fetch top 10 mixed notifications

		const interval = setInterval(() => {
			if (!isOpen) {
				getUnreadNotifications();
				getRecentNotifications(10);
			}
		}, 60000);

		return () => clearInterval(interval);
	}, [getUnreadNotifications, getRecentNotifications, isOpen]);

	const handleReadAll = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		await markAllRead();
		// Refresh lists
		getUnreadNotifications();
		getRecentNotifications(10);
		setIsOpen(false);
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<button
					suppressHydrationWarning
					type="button"
					className="relative text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
					aria-label="Notifications"
				>
					<Bell className="h-[22px] w-[22px]" strokeWidth={2} />
					{unreadCount > 0 && (
						<span className="absolute 0 top-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-slate-950"></span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[380px]">
				<div className="flex items-center justify-between px-2 py-1.5 p-2">
					<DropdownMenuLabel className="text-[#005ca9] dark:text-slate-100 font-semibold p-0">
						Notifications
					</DropdownMenuLabel>
					{unreadCount > 0 && (
						<button
							onClick={handleReadAll}
							className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
							disabled={loadingNotifications}
						>
							<CheckCheck className="h-3 w-3" />
							Mark all read
						</button>
					)}
				</div>
				<DropdownMenuSeparator />
				<ScrollArea className="h-[350px]">
					{recentNotifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center text-sm text-gray-500 dark:text-slate-400">
							<Bell className="mb-2 h-8 w-8 opacity-20" />
							<p>No new notifications</p>
						</div>
					) : (
						<div className="flex flex-col">
							{recentNotifications.map((item) => {
								const isRead = item.status === "read";
								return (
									<DropdownMenuItem
										key={item.id}
										asChild
										className="cursor-pointer p-0 focus:bg-transparent"
									>
										<Link
											href="/inbox"
											className={clsx(
												"flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
												!isRead && "bg-blue-50/30 dark:bg-blue-900/10"
											)}
										>
											<div
												className={clsx(
													"flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
													!isRead
														? "bg-blue-100 dark:bg-blue-900/30"
														: "bg-slate-100 dark:bg-slate-800"
												)}
											>
												{resolveIcon(item.type)}
											</div>
											<div className="flex min-w-0 flex-1 flex-col gap-1">
												<div className="flex items-start justify-between gap-2">
													<span
														className={clsx(
															"min-w-0 line-clamp-1 text-sm",
															!isRead
																? "font-semibold text-blue-900 dark:text-blue-100"
																: "font-medium text-slate-700 dark:text-slate-300"
														)}
													>
														{item.title}
													</span>
													{item.created_at && (
														<span className="shrink-0 text-[10px] text-slate-400">
															{formatDistanceToNow(new Date(item.created_at), {
																addSuffix: true,
															})}
														</span>
													)}
												</div>
												{item.description && (
													<p className="line-clamp-2 break-all text-xs text-slate-500 dark:text-slate-400">
														{item.description}
													</p>
												)}
												{!isRead && (
													<div className="mt-1 flex items-center gap-1.5">
														<span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
														<span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
															New
														</span>
													</div>
												)}
											</div>
										</Link>
									</DropdownMenuItem>
								);
							})}
						</div>
					)}
				</ScrollArea>
				<DropdownMenuSeparator />
				<div className="p-2">
					<Link
						href="/inbox"
						className="flex w-full items-center justify-center rounded-md bg-blue-50 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
					>
						View all in Inbox
					</Link>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default NotificationMenu;
