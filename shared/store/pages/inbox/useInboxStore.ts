import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";
import { errorToast, infoToast } from "@/shared/helper/toast";
import { resolveErrorMessage, resolveResponseMessage } from "@/shared/helper/apiMessages";
import type { IPaginationMeta } from "@/shared/store/pages/resume/useResumeStore";

export type InboxStatus = "unread" | "read" | "archived";
export type InboxType = "batch" | "application" | "interview";

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
    getRecentNotifications: (limit?: number, accessToken?: string | null) => Promise<void>;
    getInboxes: (
        status: InboxStatus | undefined | null,
        sort_by: string,
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

const getToken = (accessToken?: string | null) => {
    if (accessToken) return accessToken;
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

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
        const token = getToken(accessToken);
        if (!token) return;
        set({ loadingNotifications: true });
        try {
            const response = await apiClient.get("/agency/inbox", {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    status: "unread",
                    sort_by: "created_at",
                    sort_order: "desc",
                    page: 1,
                    limit: 10,
                },
            });
            const notifications = (response.data?.data ?? response.data ?? []) as InboxItem[];
            const meta = (response.data?.meta ?? null) as IPaginationMeta | null;
            set({ notifications, unreadCount: meta?.total ?? 0 });
        } catch {
            set({ notifications: [], unreadCount: 0 });
        } finally {
            set({ loadingNotifications: false });
        }
    },
    getRecentNotifications: async (limit = 10, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        // We don't necessarily need a separate loading state for the dropdown if we want it to be silent or reuse existing, 
        // but let's reuse loadingNotifications for simplicity or add a new one if needed. 
        // For now, reusing loadingNotifications might be confusing if it affects the unread count fetch.
        // Let's just set the state without a specific loading flag for now or reuse `loadingNotifications` carefully.
        // Actually, let's just make it silent update for the dropdown list.
        try {
            const response = await apiClient.get("/agency/inbox", {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    // No status filter to get ALL (read + unread)
                    sort_by: "created_at",
                    sort_order: "desc",
                    page: 1,
                    limit,
                },
            });
            const recentNotifications = (response.data?.data ?? response.data ?? []) as InboxItem[];
            set({ recentNotifications });
        } catch {
            set({ recentNotifications: [] });
        }
    },
    getInboxes: async (status, sort_by, sort_order, page, type, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return;
        set({ loadingInboxes: true });
        try {
            const params: Record<string, unknown> = {
                sort_by,
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
            const response = await apiClient.get("/agency/inbox", {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            const inboxes = (response.data?.data ?? response.data ?? []) as InboxItem[];
            const meta = (response.data?.meta ?? null) as IPaginationMeta | null;
            set({ inboxes, meta });
        } catch {
            set({ inboxes: [], meta: null });
        } finally {
            set({ loadingInboxes: false });
        }
    },
    archiveInbox: async (id, accessToken) => {
        const token = getToken(accessToken);
        if (!token) return false;
        set({ inboxActionLoading: id });
        try {
            const response = await apiClient.patch(`/agency/inbox/${id}/archive`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
        const token = getToken(accessToken);
        if (!token) return false;
        set({ inboxActionLoading: id });
        try {
            const response = await apiClient.patch(`/agency/inbox/${id}/unarchive`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
        const token = getToken(accessToken);
        if (!token) return false;
        set({ inboxActionLoading: id });
        try {
            const response = await apiClient.patch(`/agency/inbox/${id}/read`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
        const token = getToken(accessToken);
        if (!token) return false;
        set({ inboxActionLoading: -1 });
        try {
            const response = await apiClient.patch("/agency/inbox/read-all", null, {
                headers: { Authorization: `Bearer ${token}` },
            });
            infoToast(resolveResponseMessage(response, "All inbox items marked as read."));
            // Refresh unread count
            const state = useInboxStore.getState();
            state.getUnreadNotifications(accessToken);
            return true;
        } catch (error) {
            errorToast(resolveErrorMessage(error, "Couldn't mark all inboxes as read."));
            return false;
        } finally {
            set({ inboxActionLoading: null });
        }
    },
}));

export default useInboxStore;

