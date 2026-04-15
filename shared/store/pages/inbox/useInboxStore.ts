import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/authTokens";
import { errorToast, infoToast } from "@/shared/helper/toast";
import {
	resolveErrorMessage,
	resolveResponseMessage,
} from "@/shared/helper/apiMessages";
import {
	BackendApiClient,
	type IPaginationMeta,
} from "@/shared/store/pages/resume/useResumeStore";

export type InboxStatus = "unread" | "read" | "archived";
export type InboxType =
	| "agency_signup"
	| "candidate_signup"
	| "interview_completed"
	| "subscription_payment"
	| "batch_failed"
	| "new_application"
	| "failed_log";

export type InboxItem = {
	id: number;
	type: InboxType;
	status: InboxStatus;
	severity: "info" | "warning" | "error" | "success";
	title: string;
	description?: string | null;
	created_at?: string;
	updated_at?: string;
	agency_id: number;
	job_id?: number | null;
	batch_id?: number | null;
	job_application_id?: number | null;
	interview_session_id?: number | null;
	job?: { id: number; title: string } | null;
	batch?: {
		id: number;
		batch_id?: string | null;
		status?: string | null;
		ai_meta?: Record<string, unknown> | null;
	} | null;
};

type InboxSortOrder = "asc" | "desc";

interface IInboxStore {
	notifications: InboxItem[];
	recentNotifications: InboxItem[];
	unreadCount: number;
	loadingNotifications: boolean;
	inboxes: InboxItem[];
	meta: IPaginationMeta | null;
	loadingInboxes: boolean;
	inboxActionLoading: number | null;
	getUnreadNotifications: (accessToken?: string | null) => Promise<void>;
	getRecentNotifications: (
		limit?: number,
		accessToken?: string | null
	) => Promise<void>;
	getInboxes: (
		status: InboxStatus | undefined | null,
		sort_order: InboxSortOrder,
		page: number,
		type?: InboxType | "",
		accessToken?: string | null
	) => Promise<void>;
	archiveInbox: (id: number, accessToken?: string | null) => Promise<boolean>;
	unarchiveInbox: (id: number, accessToken?: string | null) => Promise<boolean>;
	markInboxRead: (id: number, accessToken?: string | null) => Promise<boolean>;
	markAllRead: (accessToken?: string | null) => Promise<boolean>;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const REFRESH_BUFFER_SECONDS = 60; // refresh if token expires within 60 s

function getJwtExp(token: string): number | null {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return typeof payload.exp === "number" ? payload.exp : null;
	} catch {
		return null;
	}
}

function isTokenStale(token: string): boolean {
	const exp = getJwtExp(token);
	if (exp === null) return false; // can't decode — assume valid
	return Date.now() / 1000 >= exp - REFRESH_BUFFER_SECONDS;
}

async function getFreshToken(provided?: string | null): Promise<string | null> {
	const token = provided ?? Cookies.get(ACCESS_TOKEN_KEY) ?? null;
	if (!token) return null;
	if (!isTokenStale(token)) return token;

	// Token is expired (or within the buffer) — try to refresh
	const refreshToken = Cookies.get(REFRESH_TOKEN_KEY) ?? null;
	if (!refreshToken) return null;

	try {
		const res = await axios.post(`${API_BASE}/api/admin/auth/refresh`, {
			refresh_token: refreshToken,
		});
		const fresh =
			res.data?.data?.access_token ?? res.data?.access_token ?? null;
		if (!fresh) return null;

		Cookies.set(ACCESS_TOKEN_KEY, fresh);
		if (typeof window !== "undefined") {
			localStorage.setItem("access_token", fresh);
		}
		return fresh;
	} catch {
		return null;
	}
}

const useInboxStore = create<IInboxStore>((set) => ({
	notifications: [],
	recentNotifications: [],
	unreadCount: 0,
	loadingNotifications: false,
	inboxes: [],
	meta: null,
	loadingInboxes: false,
	inboxActionLoading: null,
	getUnreadNotifications: async (accessToken) => {
		const token = await getFreshToken(accessToken);
		if (!token) return;
		set({ loadingNotifications: true });
		try {
			const response = await BackendApiClient.get("/admin/inbox", {
				headers: { Authorization: `Bearer ${token}` },
				params: {
					status: "unread",
					page: 1,
					limit: 10,
				},
			});
			const notifications = (response.data?.data ??
				response.data ??
				[]) as InboxItem[];
			const meta = (response.data?.meta ?? null) as IPaginationMeta | null;
			set({ notifications, unreadCount: meta?.total ?? 0 });
		} catch {
			set({ notifications: [], unreadCount: 0 });
		} finally {
			set({ loadingNotifications: false });
		}
	},
	getRecentNotifications: async (limit = 10, accessToken) => {
		const token = await getFreshToken(accessToken);
		if (!token) return;
		// We don't necessarily need a separate loading state for the dropdown if we want it to be silent or reuse existing,
		// but let's reuse loadingNotifications for simplicity or add a new one if needed.
		// For now, reusing loadingNotifications might be confusing if it affects the unread count fetch.
		// Let's just set the state without a specific loading flag for now or reuse `loadingNotifications` carefully.
		// Actually, let's just make it silent update for the dropdown list.
		try {
			const response = await BackendApiClient.get("/admin/inbox", {
				headers: { Authorization: `Bearer ${token}` },
				params: {
					// No status filter to get ALL (read + unread)
					page: 1,
					limit,
				},
			});
			const recentNotifications = (response.data?.data ??
				response.data ??
				[]) as InboxItem[];
			set({ recentNotifications });
		} catch {
			set({ recentNotifications: [] });
		}
	},
	getInboxes: async (status, sort_order, page, type, accessToken) => {
		const token = await getFreshToken(accessToken);
		if (!token) return;
		set({ loadingInboxes: true });
		try {
			const params: Record<string, unknown> = {
				sort_order,
				page,
				limit: 20,
			};
			if (status) {
				params.status = status;
			}
			if (type) {
				params.type = type;
			}
			const response = await BackendApiClient.get("/admin/inbox", {
				headers: { Authorization: `Bearer ${token}` },
				params,
			});
			const inboxes = (response.data?.data ??
				response.data ??
				[]) as InboxItem[];
			const meta = (response.data?.meta ?? null) as IPaginationMeta | null;
			set({ inboxes, meta });
		} catch {
			set({ inboxes: [], meta: null });
		} finally {
			set({ loadingInboxes: false });
		}
	},
	archiveInbox: async (id, accessToken) => {
		const token = await getFreshToken(accessToken);
		if (!token) return false;
		set({ inboxActionLoading: id });
		try {
			const response = await BackendApiClient.patch(
				`/admin/inbox/${id}/archive`,
				null,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			infoToast(resolveResponseMessage(response, "Inbox archived."));
			// Update both lists if necessary, but importantly the main list
			return true;
		} catch (error) {
			errorToast(resolveErrorMessage(error, "Couldn't archive inbox."));
			return false;
		} finally {
			set({ inboxActionLoading: null });
		}
	},
	unarchiveInbox: async (id, accessToken) => {
		const token = await getFreshToken(accessToken);
		if (!token) return false;
		set({ inboxActionLoading: id });
		try {
			const response = await BackendApiClient.patch(
				`/admin/inbox/${id}/unarchive`,
				null,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			infoToast(resolveResponseMessage(response, "Inbox restored."));
			return true;
		} catch (error) {
			errorToast(resolveErrorMessage(error, "Couldn't restore inbox."));
			return false;
		} finally {
			set({ inboxActionLoading: null });
		}
	},
	markInboxRead: async (id, accessToken) => {
		const token = await getFreshToken(accessToken);
		if (!token) return false;
		set({ inboxActionLoading: id });
		try {
			const response = await BackendApiClient.patch(
				`/admin/inbox/${id}/read`,
				null,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			infoToast(resolveResponseMessage(response, "Inbox marked as read."));
			// Refresh unread count
			const state = useInboxStore.getState();
			state.getUnreadNotifications(accessToken);
			return true;
		} catch (error) {
			errorToast(resolveErrorMessage(error, "Couldn't mark inbox as read."));
			return false;
		} finally {
			set({ inboxActionLoading: null });
		}
	},
	markAllRead: async (accessToken) => {
		const token = await getFreshToken(accessToken);
		if (!token) return false;
		set({ inboxActionLoading: -1 });
		try {
			const response = await BackendApiClient.patch(
				"/admin/inbox/read-all",
				null,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			infoToast(
				resolveResponseMessage(response, "All inbox items marked as read.")
			);
			// Refresh unread count
			const state = useInboxStore.getState();
			state.getUnreadNotifications(accessToken);
			return true;
		} catch (error) {
			errorToast(
				resolveErrorMessage(error, "Couldn't mark all inboxes as read.")
			);
			return false;
		} finally {
			set({ inboxActionLoading: null });
		}
	},
}));

export default useInboxStore;
