"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Eye,
	Pencil,
	ShieldOff,
	Trash2,
	Briefcase,
	FileText,
	Ban,
	SquarePen,
} from "lucide-react";
import LoadingEllipsis from "@/shared/components/common/LoadingEllipsis";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";

dayjs.extend(relativeTime);

export type UserType = "company" | "candidate";
export type UserStatus = "active" | "blocked";

export type UserListItem = {
	id: number;
	name: string;
	email: string;
	type: UserType;
	status: UserStatus;
	joined_at: string;
	activity_count: number;
};

const UserTable = ({
	users,
	loading,
	hasLoaded,
	onBlock,
	onDelete,
	onEdit,
}: {
	users: UserListItem[];
	loading: boolean;
	hasLoaded: boolean;
	onBlock?: (user: UserListItem) => void;
	onDelete?: (userId: number) => void;
	onEdit?: (user: UserListItem) => void;
}) => {
	const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
	const [deleting, setDeleting] = useState(false);

	const handleDelete = async () => {
		if (!userToDelete) return;
		setDeleting(true);
		await onDelete?.(userToDelete.id);
		setDeleting(false);
		setUserToDelete(null);
	};

	return (
		<Dialog
			open={userToDelete !== null}
			onOpenChange={(open) => !open && setUserToDelete(null)}
		>
			<Table>
				<TableHeader>
					<TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
						<TableHead className="w-[260px] pl-6 h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							User
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							Type
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							Status
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							Joined
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
							Activity
						</TableHead>
						<TableHead className="h-12 text-[10px] font-bold tracking-wider text-slate-800 text-right pr-8 dark:text-slate-200 uppercase">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading || (!hasLoaded && users.length === 0) ? (
						<TableRow>
							<TableCell colSpan={6} className="text-center">
								<span className="inline-flex items-center justify-center gap-1 text-slate-500">
									<span>Loading users</span>
									<LoadingEllipsis />
								</span>
							</TableCell>
						</TableRow>
					) : users.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="text-center text-slate-500">
								No users yet.
							</TableCell>
						</TableRow>
					) : (
						users.map((user) => (
							<TableRow
								key={user.id}
								className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50"
							>
								{/* User */}
								<TableCell className="pl-6 py-4">
									<div className="flex flex-col gap-0.5">
										<span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
											{user.name}
										</span>
										<span className="text-[12px] text-slate-400 font-medium">
											{user.email}
										</span>
									</div>
								</TableCell>

								{/* Type */}
								<TableCell className="py-4">
									<span className="text-sm text-[#718096] font-medium capitalize">
										{user.type}
									</span>
								</TableCell>

								{/* Status */}
								<TableCell className="py-4">
									{user.status === "active" ? (
										<span className="inline-flex items-center rounded-full bg-[#48BB78] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">
											Active
										</span>
									) : (
										<span className="inline-flex items-center rounded-full bg-[#ef4444] px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">
											Blocked
										</span>
									)}
								</TableCell>

								{/* Joined */}
								<TableCell className="py-4 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
									{dayjs(user.joined_at).format("MMM D, YYYY")}
								</TableCell>

								{/* Activity */}
								<TableCell className="py-4">
									<span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
										{user.activity_count}
									</span>
									<span className="ml-1.5 text-[12px] font-medium text-slate-400">
										{user.type === "candidate" ? "applications" : "jobs"}
									</span>
								</TableCell>

								{/* Actions */}
								<TableCell className="py-4 pr-8">
									<div className="flex items-center justify-end gap-3">
										<button
											className="text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-200"
											title="View user"
										>
											<Eye className="h-[18px] w-[18px] stroke-[2.5]" />
										</button>
										<button
											onClick={() => onEdit?.(user)}
											className="text-[#005CA9] hover:text-amber-500 transition-colors"
											title="Edit user"
										>
											<SquarePen className="h-[18px] w-[18px] stroke-[2]" />
										</button>
										<button
											onClick={() => onBlock?.(user)}
											className="text-[#F6AD55] hover:text-orange-600 transition-colors"
											title={
												user.status === "active" ? "Block user" : "Unblock user"
											}
										>
											<Ban className="h-[18px] w-[18px] stroke-[2.5]" />
										</button>
										<button
											onClick={() => setUserToDelete(user)}
											className="text-[#E53E3E] hover:text-red-600 transition-colors"
											title="Delete user"
										>
											<Trash2 className="h-[18px] w-[18px] stroke-[2]" />
										</button>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			{/* Delete Confirmation Dialog */}
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Delete User</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete{" "}
						<span className="font-semibold text-slate-800 dark:text-slate-200">
							{userToDelete?.name}
						</span>
						? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="mt-4 gap-2 sm:gap-0">
					<button
						onClick={() => setUserToDelete(null)}
						disabled={deleting}
						className="inline-flex items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
					>
						Cancel
					</button>
					<button
						onClick={handleDelete}
						disabled={deleting}
						className="inline-flex items-center justify-center ml-3 rounded-[8px] bg-red-600 px-4 py-2 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
					>
						{deleting ? (
							<>
								<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
								Deleting...
							</>
						) : (
							"Delete User"
						)}
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default UserTable;
