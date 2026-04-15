"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import {
	Check,
	Mail,
	Trash2,
	Eye,
	Briefcase,
	Calendar,
	FileText,
	Bell,
	CreditCard,
} from "lucide-react";
import SortingMenu from "@/shared/common/features/SortingMenu";
import { Button } from "@/components/ui/button";
import useInboxStore, {
	InboxItem,
	InboxType,
} from "@/shared/store/pages/inbox/useInboxStore";
import { Tooltip } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

const typeTabs: Array<{ label: string; value: InboxType | "all" }> = [
	{ label: "All", value: "all" },
	{ label: "Applications", value: "new_application" },
	{ label: "Interviews", value: "interview_completed" },
	{ label: "Logs", value: "failed_log" },
	{ label: "Billing", value: "subscription_payment" },
	{ label: "Agency", value: "agency_signup" },
	{ label: "Candidate", value: "candidate_signup" },
	{ label: "System", value: "batch_failed" },
];

const resolveIcon = (item: InboxItem) => {
	let className = "h-5 w-5 ";

	if (item.type === "subscription_payment") {
		if (item.severity === "error")
			className += "text-red-600 dark:text-red-400";
		else if (item.severity === "warning")
			className += "text-yellow-600 dark:text-yellow-400";
		else className += "text-green-600 dark:text-green-400";
		return <CreditCard className={className} />;
	}

	className += "text-blue-600 dark:text-blue-400";
	switch (item.type) {
		case "new_application":
			return <Briefcase className={className} />;
		case "interview_completed":
			return <Calendar className={className} />;
		case "batch_failed":
			return <FileText className={className} />;
		default:
			return <Bell className={className} />;
	}
};

const resolveLink = (item: InboxItem) => {
	const jobId = item.job_id || item.job?.id;
	if (
		(item.type === "new_application" || item.type === "batch_failed") &&
		jobId
	) {
		return `/jobs`;
	}
	if (item.type === "interview_completed") {
		// If we have a specific session ID, go directly to it; otherwise fall back to interviews list
		return `/interviews`;
	}
	if (item.type === "subscription_payment") {
		return "/subscriptions";
	}
	return null;
};

const InboxPage = () => {
	const router = useRouter();
	const {
		inboxes,
		loadingInboxes,
		inboxActionLoading,
		getInboxes,
		archiveInbox,
		markInboxRead,
		markAllRead,
		unreadCount,
	} = useInboxStore();

	// We fetch "all" (undefined status) to get both read and unread
	// We filter out archived unless specifically requested (future feature), for now assume Inbox = Unread + Read
	const [activeTab, setActiveTab] = useState<InboxType | "all">("all");
	const [sortBy, setSortBy] = useState("created_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const filtersRef = useRef({
		activeTab,
		sortBy,
		sortOrder,
	});

	useEffect(() => {
		// Pass undefined for status to fetch all non-archived if API supports it,
		// OR if API treats status=undefined as ALL (including archived), we might need to filter client side.
		// Assuming API returns all based on previous change.
		// But we probably want to EXCLUDE archived from this main view.
		// If the API status filter is exact match, we might need a way to say "not archived".
		// For now, let's assume we fetch all and rely on the fact that "archived" is a specific status we can filter out or
		// if the user wants to see archived they go to a separate page (not implemented in this redesign).
		// Actually, let's fetch 'unread' and 'read' by passing undefined (all) and filtering in UI if needed,
		// or just showing everything returned.
		// If the user *archives* something, it should disappear from this list.
		// The API likely returns archived items too if status is undefined.
		// Let's rely on client-side filtering for 'archived' removal if strictly needed,
		// OR better: The requirement says "I don't want the read and the unread message, I want them all in the same area".
		// It implies "Inbox" view. Usually Inbox doesn't show Archived.
		// Let's fetch all and filter out archived in the render if the API includes them.

		const typeFilter = activeTab === "all" ? "" : activeTab;
		getInboxes(undefined, sortOrder, 1, typeFilter);
	}, [getInboxes, sortBy, sortOrder, activeTab]);

	useEffect(() => {
		filtersRef.current = { activeTab, sortBy, sortOrder };
	}, [activeTab, sortBy, sortOrder]);

	useEffect(() => {
		const handleInboxCreated = () => {
			const current = filtersRef.current;
			const typeFilter = current.activeTab === "all" ? "" : current.activeTab;
			getInboxes(undefined, current.sortOrder, 1, typeFilter);
		};
		window.addEventListener(
			"inbox:created",
			handleInboxCreated as EventListener
		);
		return () => {
			window.removeEventListener(
				"inbox:created",
				handleInboxCreated as EventListener
			);
		};
	}, [getInboxes]);

	const sortOptions = useMemo(
		() => [
			{ key: "created_at", value: "desc" as const },
			{ key: "created_at", value: "asc" as const },
		],
		[]
	);

	const activeSort = useMemo(
		() => ({ key: sortBy, value: sortOrder }),
		[sortBy, sortOrder]
	);

	const handleArchive = async (item: InboxItem) => {
		const done = await archiveInbox(item.id);
		if (done) {
			const typeFilter = activeTab === "all" ? "" : activeTab;
			getInboxes(undefined, sortOrder, 1, typeFilter);
		}
	};

	const handleMarkRead = async (item: InboxItem) => {
		const done = await markInboxRead(item.id);
		if (done) {
			const typeFilter = activeTab === "all" ? "" : activeTab;
			getInboxes(undefined, sortOrder, 1, typeFilter);
		}
	};

	const handleMarkAllRead = async () => {
		const done = await markAllRead();
		if (done) {
			const typeFilter = activeTab === "all" ? "" : activeTab;
			getInboxes(undefined, sortOrder, 1, typeFilter);
		}
	};

	// Filter out archived items from the view
	const visibleInboxes = inboxes.filter((item) => item.status !== "archived");

	const renderSkeleton = () => (
		<div className="space-y-4">
			{Array.from({ length: 4 }).map((_, index) => (
				<div
					key={`skeleton-${index}`}
					className="flex h-24 w-full animate-pulse flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950"
				>
					<div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800"></div>
					<div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-900"></div>
				</div>
			))}
		</div>
	);

	return (
		<div className="w-full space-y-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
						Inbox
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						You have {unreadCount} unread notifications
					</p>
				</div>
				<Button
					onClick={handleMarkAllRead}
					disabled={unreadCount === 0 || inboxActionLoading === -1}
					className="bg-[#005CA9] text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
				>
					{inboxActionLoading === -1 ? (
						"Processing..."
					) : (
						<>
							<Check className="mr-2 h-4 w-4" /> Mark All Read
						</>
					)}
				</Button>
			</div>

			<div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
				<div className="flex w-full items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm sm:w-auto">
					{typeTabs.map((tab) => (
						<button
							key={tab.value}
							onClick={() => setActiveTab(tab.value)}
							className={clsx(
								"relative whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
								activeTab === tab.value
									? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
									: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
							)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Note: SortingMenu might need type adjustment if strict */}
				<div className="w-full sm:w-[220px] shrink-0">
					<SortingMenu
						options={sortOptions}
						value={activeSort}
						onChange={(key, order) => {
							setSortBy(key);
							setSortOrder(order);
						}}
						placeholder="Sort by"
						triggerClassName="h-10 w-full"
					/>
				</div>
			</div>

			<div className="space-y-4">
				{loadingInboxes ? (
					renderSkeleton()
				) : visibleInboxes.length === 0 ? (
					<div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
						<Mail className="mb-4 h-10 w-10 text-slate-300 dark:text-slate-700" />
						<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
							No notifications found
						</p>
					</div>
				) : (
					visibleInboxes.map((item) => {
						const link = resolveLink(item);
						const isRead = item.status === "read";

						return (
							<motion.div
								whileHover={{ y: -4 }}
								transition={{ type: "spring", stiffness: 300, damping: 20 }}
								key={item.id}
								className={clsx(
									"group relative flex flex-col gap-4 rounded-xl border bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-950",
									link && "cursor-pointer",
									!isRead && "border-l-4 border-l-blue-600",
									isRead
										? "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20"
										: "border-slate-200 dark:border-slate-700"
								)}
								onClick={(e) => {
									if (link) {
										router.push(link);
									}
								}}
							>
								<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
									<div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
										<div
											className={clsx(
												"mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
												isRead
													? "bg-slate-100 dark:bg-slate-900"
													: "bg-blue-50 dark:bg-blue-900/20"
											)}
										>
											{resolveIcon(item)}
										</div>
										<div className="space-y-1 flex-1 min-w-0">
											<h3
												className={clsx(
													"font-semibold text-slate-900 dark:text-slate-100 break-words",
													isRead &&
														"font-medium text-slate-600 dark:text-slate-400"
												)}
											>
												{item.title}
											</h3>
											<p className="text-sm text-slate-500 dark:text-slate-400 break-words">
												{item.description}
											</p>
											<p className="text-xs text-slate-400 dark:text-slate-500">
												{item.created_at
													? formatDistanceToNow(new Date(item.created_at), {
															addSuffix: true,
														})
													: ""}
											</p>
										</div>
									</div>

									<div
										className="flex items-center gap-2 self-end sm:self-auto shrink-0 relative z-10"
										onClick={(e) => e.stopPropagation()}
									>
										{/* Status Dot */}
										{!isRead && (
											<div className="mr-2 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50 dark:ring-blue-900/20"></div>
										)}

										{link && (
											<Tooltip content="View Details">
												<Link href={link} onClick={(e) => e.stopPropagation()}>
													<Button
														size="icon"
														variant="ghost"
														className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
													>
														<Eye className="h-4 w-4" />
													</Button>
												</Link>
											</Tooltip>
										)}

										{!isRead && (
											<Tooltip content="Mark as read">
												<Button
													size="icon"
													variant="ghost"
													onClick={(e: React.MouseEvent) => {
														e.stopPropagation();
														handleMarkRead(item);
													}}
													className="h-8 w-8 text-slate-400 hover:text-green-600 dark:hover:text-green-400"
												>
													<Check className="h-4 w-4" />
												</Button>
											</Tooltip>
										)}

										<Tooltip content="Archive">
											<Button
												size="icon"
												variant="ghost"
												onClick={(e: React.MouseEvent) => {
													e.stopPropagation();
													handleArchive(item);
												}}
												className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</Tooltip>
									</div>
								</div>
							</motion.div>
						);
					})
				)}
			</div>
		</div>
	);
};

export default InboxPage;
