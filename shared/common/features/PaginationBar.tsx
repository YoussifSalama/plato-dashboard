"use client";

import clsx from "clsx";
import { cn } from "@/lib/utils";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

type PageItem = number | "ellipsis";

const buildPageItems = (
	currentPage: number,
	totalPages: number,
	maxVisible: number
): PageItem[] => {
	if (totalPages <= 1) return [1];
	if (totalPages <= maxVisible + 2) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const pages = new Set<number>();
	pages.add(1);
	pages.add(totalPages);

	const half = Math.floor(maxVisible / 2);
	let start = Math.max(2, currentPage - half);
	let end = Math.min(totalPages - 1, currentPage + half);

	if (currentPage <= 1 + half) {
		start = 2;
		end = 1 + maxVisible;
	} else if (currentPage >= totalPages - half) {
		end = totalPages - 1;
		start = totalPages - maxVisible;
	}

	start = Math.max(2, start);
	end = Math.min(totalPages - 1, end);

	for (let i = start; i <= end; i += 1) {
		pages.add(i);
	}

	const sorted = Array.from(pages).sort((a, b) => a - b);
	const items: PageItem[] = [];
	let prev = 0;
	for (const page of sorted) {
		if (prev && page - prev > 1) {
			items.push("ellipsis");
		}
		items.push(page);
		prev = page;
	}
	return items;
};

const PaginationBar = ({
	currentPage,
	totalPages,
	onPageChange,
	maxVisible = 5,
	className,
	totalItems,
	itemName = "items",
}: {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	maxVisible?: number;
	className?: string;
	totalItems?: number;
	itemName?: string;
}) => {
	const items = buildPageItems(currentPage, totalPages, maxVisible);
	const canGoPrev = currentPage > 1;
	const canGoNext = currentPage < totalPages;

	// Calculate showing range
	const itemsPerPage = 15; // default limit based on ResumeClient
	const showingStart =
		totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
	const showingEnd = totalItems
		? Math.min(currentPage * itemsPerPage, totalItems)
		: 0;

	const itemClassName = clsx(
		"flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-slate-600 transition-colors",
		"hover:bg-slate-100 hover:text-slate-900 cursor-pointer",
		"dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
	);
	const activeItemClassName = clsx(
		"bg-[#095b9d] text-white hover:bg-[#084b82] hover:text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 font-semibold"
	);

	return (
		<div
			className={cn(
				"flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950",
				className
			)}
		>
			<div className="text-sm text-slate-500 dark:text-slate-400">
				{totalItems !== undefined ? (
					<>
						Showing{" "}
						<span className="font-semibold text-slate-700 dark:text-slate-200">
							{showingEnd}
						</span>{" "}
						of{" "}
						<span className="font-semibold text-slate-700 dark:text-slate-200">
							{totalItems}
						</span>{" "}
						{itemName}
					</>
				) : (
					<>
						Page {currentPage} of {totalPages}
					</>
				)}
			</div>

			<Pagination className="mx-0 w-auto justify-end">
				<PaginationContent className="gap-1.5 flex items-center">
					<PaginationItem>
						<PaginationPrevious
							href="#"
							className={clsx(
								"pr-3 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors bg-transparent border-0 hover:bg-transparent shadow-none px-0",
								!canGoPrev && "pointer-events-none opacity-50"
							)}
							onClick={(event) => {
								event.preventDefault();
								if (canGoPrev) onPageChange(currentPage - 1);
							}}
						/>
					</PaginationItem>

					{items.map((item, index) => {
						if (item === "ellipsis") {
							return (
								<PaginationItem key={`ellipsis-${index}`}>
									<PaginationEllipsis />
								</PaginationItem>
							);
						}
						return (
							<PaginationItem key={item}>
								<PaginationLink
									href="#"
									isActive={item === currentPage}
									className={clsx(
										itemClassName,
										item === currentPage && activeItemClassName
									)}
									onClick={(event) => {
										event.preventDefault();
										if (item !== currentPage) {
											onPageChange(item);
										}
									}}
								>
									{item}
								</PaginationLink>
							</PaginationItem>
						);
					})}

					<PaginationItem>
						<PaginationNext
							href="#"
							className={clsx(
								"pl-3 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors bg-transparent border-0 hover:bg-transparent shadow-none px-0",
								!canGoNext && "pointer-events-none opacity-50"
							)}
							onClick={(event) => {
								event.preventDefault();
								if (canGoNext) onPageChange(currentPage + 1);
							}}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
};

export default PaginationBar;
