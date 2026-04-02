"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Search,
	ChevronDown,
	Check,
	Eye,
	Pencil,
	SquarePen,
} from "lucide-react";
import clsx from "clsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaginationBar from "@/shared/common/features/PaginationBar";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "Published" | "Draft";

type BlogPost = {
	id: number;
	title: string;
	author: string;
	category: string;
	published: string;
	views: number;
	status: BlogStatus;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_POSTS: BlogPost[] = [
	{
		id: 1,
		title: "10 Tips for Landing Your Dream Job",
		author: "Admin",
		category: "Career",
		published: "Feb 20, 2026",
		views: 2340,
		status: "Published",
	},
	{
		id: 2,
		title: "How to Write a Winning Resume",
		author: "Admin",
		category: "Resume",
		published: "Feb 15, 2026",
		views: 3459,
		status: "Published",
	},
	{
		id: 3,
		title: "Interview Success Strategies",
		author: "Admin",
		category: "Interviews",
		published: "Feb 10, 2026",
		views: 1087,
		status: "Published",
	},
	{
		id: 4,
		title: "Top Skills Employers Look for in 2026",
		author: "Admin",
		category: "Career",
		published: "Feb 05, 2026",
		views: 4210,
		status: "Published",
	},
	{
		id: 5,
		title: "How to Negotiate Your Salary",
		author: "Admin",
		category: "Career",
		published: "Jan 30, 2026",
		views: 2875,
		status: "Published",
	},
	{
		id: 6,
		title: "Remote Work Best Practices",
		author: "Admin",
		category: "Workplace",
		published: "Jan 25, 2026",
		views: 1930,
		status: "Published",
	},
	{
		id: 7,
		title: "Building a Personal Brand on LinkedIn",
		author: "Admin",
		category: "Networking",
		published: "Jan 20, 2026",
		views: 3102,
		status: "Published",
	},
	{
		id: 8,
		title: "How to Handle Rejection After an Interview",
		author: "Admin",
		category: "Interviews",
		published: "Jan 15, 2026",
		views: 890,
		status: "Published",
	},
	{
		id: 9,
		title: "The Future of Hiring: AI & Recruitment",
		author: "Admin",
		category: "Industry",
		published: "Jan 10, 2026",
		views: 5640,
		status: "Published",
	},
	{
		id: 10,
		title: "Cover Letter Templates That Get Results",
		author: "Admin",
		category: "Resume",
		published: "Jan 05, 2026",
		views: 2210,
		status: "Published",
	},
	{
		id: 11,
		title: "Networking Tips for Introverts",
		author: "Admin",
		category: "Networking",
		published: "Dec 28, 2025",
		views: 1560,
		status: "Published",
	},
	{
		id: 12,
		title: "How to Switch Careers Successfully",
		author: "Admin",
		category: "Career",
		published: "Dec 20, 2025",
		views: 3780,
		status: "Published",
	},
	{
		id: 13,
		title: "Understanding Employment Contracts",
		author: "Admin",
		category: "Workplace",
		published: "Dec 15, 2025",
		views: 720,
		status: "Published",
	},
	{
		id: 14,
		title: "Draft: Trends in Tech Hiring for 2027",
		author: "Admin",
		category: "Industry",
		published: "—",
		views: 0,
		status: "Draft",
	},
	{
		id: 15,
		title: "Draft: Soft Skills That Matter Most",
		author: "Admin",
		category: "Career",
		published: "—",
		views: 0,
		status: "Draft",
	},
];

const CATEGORY_OPTIONS = [
	{ label: "All Categories", value: "all" },
	{ label: "Career", value: "Career" },
	{ label: "Resume", value: "Resume" },
	{ label: "Interviews", value: "Interviews" },
	{ label: "Workplace", value: "Workplace" },
	{ label: "Networking", value: "Networking" },
	{ label: "Industry", value: "Industry" },
];

const STATUS_OPTIONS: { label: string; value: BlogStatus | "all" }[] = [
	{ label: "All Status", value: "all" },
	{ label: "Published", value: "Published" },
	{ label: "Draft", value: "Draft" },
];

const PAGE_SIZE = 8;

// ─── Page ─────────────────────────────────────────────────────────────────────

const AllBlogsPage = () => {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategory] = useState("all");
	const [statusFilter, setStatus] = useState<BlogStatus | "all">("all");
	const [page, setPage] = useState(1);

	const filtered = MOCK_POSTS.filter((p) => {
		const matchSearch =
			!search || p.title.toLowerCase().includes(search.toLowerCase());
		const matchCategory =
			categoryFilter === "all" || p.category === categoryFilter;
		const matchStatus = statusFilter === "all" || p.status === statusFilter;
		return matchSearch && matchCategory && matchStatus;
	});

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const selectedCategory = CATEGORY_OPTIONS.find(
		(o) => o.value === categoryFilter
	)!;
	const selectedStatus = STATUS_OPTIONS.find((o) => o.value === statusFilter)!;

	const handleFilterChange = (fn: () => void) => {
		fn();
		setPage(1);
	};

	return (
		<section className="space-y-6 w-full">
			{/* Header */}
			<div className="flex items-center gap-3 px-2">
				<button
					onClick={() => router.back()}
					className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:hover:text-slate-200 shrink-0"
				>
					<ArrowLeft className="h-4 w-4" />
				</button>
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						All Blog Posts
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Full list of blog posts and drafts
					</p>
				</div>
			</div>

			{/* Filter bar */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 flex flex-wrap items-center gap-2 px-4 py-2.5">
				<div className="flex flex-1 items-center gap-2 min-w-48">
					<Search className="h-4 w-4 shrink-0 text-slate-400" />
					<input
						type="text"
						placeholder="Search posts..."
						value={search}
						onChange={(e) =>
							handleFilterChange(() => setSearch(e.target.value))
						}
						className="w-full bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200"
					/>
				</div>

				<div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

				{/* Category */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
						>
							{selectedCategory.label}
							<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-44 rounded-xl p-1.5 dark:bg-slate-900 dark:border-slate-800"
					>
						{CATEGORY_OPTIONS.map((opt) => (
							<DropdownMenuItem
								key={opt.value}
								onClick={() => handleFilterChange(() => setCategory(opt.value))}
								className={clsx(
									"flex items-center justify-between rounded-lg text-[13px] cursor-pointer",
									categoryFilter === opt.value && "font-semibold"
								)}
							>
								{opt.label}
								{categoryFilter === opt.value && (
									<Check className="h-3.5 w-3.5 text-blue-500" />
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Status */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
						>
							{selectedStatus.label}
							<ChevronDown className="h-3.5 w-3.5 text-slate-400" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-40 rounded-xl p-1.5 dark:bg-slate-900 dark:border-slate-800"
					>
						{STATUS_OPTIONS.map((opt) => (
							<DropdownMenuItem
								key={opt.value}
								onClick={() => handleFilterChange(() => setStatus(opt.value))}
								className={clsx(
									"flex items-center justify-between rounded-lg text-[13px] cursor-pointer",
									statusFilter === opt.value && "font-semibold"
								)}
							>
								{opt.label}
								{statusFilter === opt.value && (
									<Check className="h-3.5 w-3.5 text-blue-500" />
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Table */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 overflow-hidden pb-4">
				<table className="w-full">
					<thead>
						<tr className="border-b border-slate-100 dark:border-slate-800">
							{[
								"TITLE",
								"AUTHOR",
								"CATEGORY",
								"PUBLISHED",
								"VIEWS",
								"STATUS",
								"ACTIONS",
							].map((h) => (
								<th
									key={h}
									className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{paginated.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="py-16 text-center text-[14px] text-slate-400"
								>
									No posts found.
								</td>
							</tr>
						) : (
							paginated.map((post) => (
								<tr
									key={post.id}
									className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
								>
									<td className="px-6 py-3.5 text-[13px] font-semibold text-slate-800 dark:text-slate-100 max-w-xs">
										{post.title}
									</td>
									<td className="px-6 py-3.5 text-[13px] text-slate-400">
										{post.author}
									</td>
									<td className="px-6 py-3.5">
										<span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
											{post.category}
										</span>
									</td>
									<td className="px-6 py-3.5 text-[13px] text-slate-400 whitespace-nowrap">
										{post.published}
									</td>
									<td className="px-6 py-3.5 text-[13px] font-medium text-slate-600 dark:text-slate-300">
										{post.views.toLocaleString()}
									</td>
									<td className="px-6 py-3.5">
										<span
											className={clsx(
												"inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
												post.status === "Published"
													? "bg-emerald-500 text-white"
													: "bg-slate-400 text-white"
											)}
										>
											{post.status}
										</span>
									</td>
									<td className="px-6 py-3.5">
										<div className="flex items-center gap-1">
											<button
												className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800"
												title="Preview"
											>
												<Eye className="h-4 w-4" />
											</button>
											<button
												className="flex h-7 w-7 items-center justify-center rounded-lg text-[#005ca9] hover:bg-blue-100 transition-colors dark:hover:bg-blue-950/30"
												title="Edit"
											>
												<SquarePen className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				{filtered.length > 0 && (
					<div className="mt-2 px-2">
						<PaginationBar
							currentPage={page}
							totalPages={totalPages}
							totalItems={filtered.length}
							itemName="posts"
							pageSize={PAGE_SIZE}
							onPageChange={setPage}
							className="border-0 shadow-none px-4"
						/>
					</div>
				)}
			</div>
		</section>
	);
};

export default AllBlogsPage;
