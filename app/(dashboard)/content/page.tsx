"use client";

import { useState } from "react";
import {
	FileText,
	BookOpen,
	FileEdit,
	Eye,
	Plus,
	Pencil,
	TrendingUp,
	PencilIcon,
	SquarePen,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageStatus = "Published" | "Draft";

type StaticPage = {
	id: number;
	title: string;
	lastUpdated: string;
	status: PageStatus;
	views: number;
};

type BlogPost = {
	id: number;
	title: string;
	author: string;
	published: string;
	views: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PAGES: StaticPage[] = [
	{
		id: 1,
		title: "About Us",
		lastUpdated: "Feb 15, 2026",
		status: "Published",
		views: 1845,
	},
	{
		id: 2,
		title: "Terms & Conditions",
		lastUpdated: "Jan 20, 2026",
		status: "Published",
		views: 3421,
	},
	{
		id: 3,
		title: "Privacy Policy",
		lastUpdated: "Jan 20, 2026",
		status: "Published",
		views: 2876,
	},
	{
		id: 4,
		title: "FAQ",
		lastUpdated: "Feb 10, 2026",
		status: "Published",
		views: 890,
	},
	{
		id: 5,
		title: "Contact Us",
		lastUpdated: "Feb 18, 2026",
		status: "Published",
		views: 664,
	},
	{
		id: 6,
		title: "Career Tips",
		lastUpdated: "Feb 22, 2026",
		status: "Draft",
		views: 0,
	},
];

const MOCK_BLOG_POSTS: BlogPost[] = [
	{
		id: 1,
		title: "10 Tips for Landing Your Dream Job",
		author: "Admin",
		published: "Feb 20, 2026",
		views: 2340,
	},
	{
		id: 2,
		title: "How to Write a Winning Resume",
		author: "Admin",
		published: "Feb 15, 2026",
		views: 3459,
	},
	{
		id: 3,
		title: "Interview Success Strategies",
		author: "Admin",
		published: "Feb 10, 2026",
		views: 1087,
	},
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
	icon,
	iconBg,
	iconColor,
	label,
	value,
}: {
	icon: React.ReactNode;
	iconBg: string;
	iconColor: string;
	label: string;
	value: string;
}) => (
	<div className="flex flex-col gap-4 rounded-2xl bg-white border border-slate-100 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
		<div
			className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
			style={{ backgroundColor: iconBg }}
		>
			<span style={{ color: iconColor }}>{icon}</span>
		</div>
		<div>
			<p className="text-[14px] font-medium text-slate-400 dark:text-slate-500">
				{label}
			</p>
			<p className="mt-0.5 text-[26px] font-bold text-slate-900 dark:text-slate-50 leading-tight">
				{value}
			</p>
		</div>
	</div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: PageStatus }) => (
	<span
		className={clsx(
			"inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide",
			status === "Published"
				? "bg-emerald-500 text-white"
				: "bg-slate-400 text-white"
		)}
	>
		{status}
	</span>
);

// ─── Action Buttons ───────────────────────────────────────────────────────────

const ActionButtons = () => (
	<div className="flex items-center gap-2">
		<button
			className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200"
			title="Preview"
		>
			<Eye className="h-4 w-4" />
		</button>
		<button
			className="flex h-7 w-7 items-center justify-center rounded-lg text-[#005CA9] hover:bg-blue-50 hover:text-blue-600 transition-colors dark:hover:bg-blue-950/30"
			title="Edit"
		>
			<SquarePen className="h-4 w-4" />
		</button>
	</div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ContentPage = () => {
	const [pages] = useState<StaticPage[]>(MOCK_PAGES);
	const [blogPosts] = useState<BlogPost[]>(MOCK_BLOG_POSTS);

	const totalViews =
		pages.reduce((s, p) => s + p.views, 0) +
		blogPosts.reduce((s, p) => s + p.views, 0);
	const draftsCount = pages.filter((p) => p.status === "Draft").length;

	return (
		<section className="space-y-6 w-full">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
				<div>
					<h2 className="text-[26px] font-bold text-slate-900 tracking-tight dark:text-slate-100">
						Content Management
					</h2>
					<p className="text-[14px] text-slate-500 mt-0.5 dark:text-slate-400">
						Manage static pages, blog posts, and platform content
					</p>
				</div>
				<button className="inline-flex items-center gap-2 rounded-xl bg-[#005ca9] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#004e8f] transition-colors shadow-sm self-start sm:self-auto">
					<Plus className="h-4 w-4" />
					Create Content
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					icon={<FileText className="h-5 w-5" />}
					iconBg="#dbeafe"
					iconColor="#2563eb"
					label="Total Pages"
					value={String(pages.length + 18)}
				/>
				<StatCard
					icon={<BookOpen className="h-5 w-5" />}
					iconBg="#ede9fe"
					iconColor="#7c3aed"
					label="Blog Posts"
					value={String(blogPosts.length + 45)}
				/>
				<StatCard
					icon={<FileEdit className="h-5 w-5" />}
					iconBg="#fef3c7"
					iconColor="#d97706"
					label="Drafts"
					value={String(draftsCount + 4)}
				/>
				<StatCard
					icon={<Eye className="h-5 w-5" />}
					iconBg="#dcfce7"
					iconColor="#16a34a"
					label="Total Views"
					value={`${(totalViews / 1000).toFixed(1)}K`}
				/>
			</div>

			{/* Static Pages */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
					<h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
						Static Pages
					</h3>
				</div>
				<table className="w-full">
					<thead>
						<tr className="border-b border-slate-100 dark:border-slate-800">
							{["TITLE", "LAST UPDATED", "STATUS", "VIEWS", "ACTIONS"].map(
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
						{pages.map((page) => (
							<tr
								key={page.id}
								className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
							>
								<td className="px-6 py-3.5">
									<div className="flex items-center gap-2.5">
										<FileText className="h-4 w-4 shrink-0 text-slate-400" />
										<span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
											{page.title}
										</span>
									</div>
								</td>
								<td className="px-6 py-3.5 text-[13px] text-slate-400">
									{page.lastUpdated}
								</td>
								<td className="px-6 py-3.5">
									<StatusBadge status={page.status} />
								</td>
								<td className="px-6 py-3.5 text-[13px] font-medium text-slate-600 dark:text-slate-300">
									{page.views.toLocaleString()}
								</td>
								<td className="px-6 py-3.5">
									<ActionButtons />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Recent Blog Posts */}
			<div className="rounded-2xl bg-white border border-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
					<h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
						Recent Blog Posts
					</h3>
					<Link
						href="/content/blogs"
						className="text-[13px] font-semibold text-blue-500 hover:text-blue-600 transition-colors"
					>
						View All Posts
					</Link>
				</div>
				<table className="w-full">
					<thead>
						<tr className="border-b border-slate-100 dark:border-slate-800">
							{["TITLE", "AUTHOR", "PUBLISHED", "VIEWS", "ACTIONS"].map((h) => (
								<th
									key={h}
									className="px-6 py-3 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{blogPosts.map((post) => (
							<tr
								key={post.id}
								className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
							>
								<td className="px-6 py-3.5 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
									{post.title}
								</td>
								<td className="px-6 py-3.5 text-[13px] text-slate-400">
									{post.author}
								</td>
								<td className="px-6 py-3.5 text-[13px] text-slate-400">
									{post.published}
								</td>
								<td className="px-6 py-3.5 text-[13px] font-medium text-slate-600 dark:text-slate-300">
									{post.views.toLocaleString()}
								</td>
								<td className="px-6 py-3.5">
									<ActionButtons />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
};

export default ContentPage;
