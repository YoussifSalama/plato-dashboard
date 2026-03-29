import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";

export type InterviewCandidateSummary = {
    name: string | null;
    email: string | null;
};

export type InterviewSessionItem = {
    id: number;
    status: string;
    created_at: string;
    updated_at: string;
    job_title: string | null;
    candidate: InterviewCandidateSummary | null;
    selected_date?: string | null;
    is_candidate_submitted?: boolean;
    is_agency_submitted?: boolean;
    agency_decision?: string | null;
};

export type InterviewSessionsMeta = {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    current_page: number;
    next_page: number | null;
    previous_page: number | null;
    has_next_page: boolean;
    has_previous_page: boolean;
    is_first_page: boolean;
    is_last_page: boolean;
};

type InterviewSessionsStore = {
    sessions: InterviewSessionItem[];
    meta: InterviewSessionsMeta | null;
    loading: boolean;
    hasLoaded: boolean;
    getInterviewSessions: (
        search: string,
        sort_by: string,
        sort_order: "asc" | "desc",
        page: number,
        agencyId?: number | null,
        status?: string,
        date?: string
    ) => Promise<void>;
    submitFeedback: (dto: any) => Promise<void>;
    getFeedback: (sessionId: number) => Promise<any>;
};

const getToken = () => {
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

export const useInterviewSessionsStore = create<InterviewSessionsStore>((set) => {
    return {
        sessions: [],
        meta: null,
        loading: false,
        hasLoaded: false,
        getInterviewSessions: async (
            search: string,
            sort_by: string,
            sort_order: "asc" | "desc",
            page: number,
            agencyId?: number | null,
            status?: string,
            date?: string
        ) => {
            set({ loading: true });
            const token = getToken();
            if (!token) {
                set({ loading: false });
                return;
            }
            const params: Record<string, unknown> = {
                sort_by,
                sort_order,
                page,
                limit: 10,
            };
            if (search?.trim()) {
                params.search = search.trim();
            }
            if (status && status !== "all") {
                params.status = status;
            }
            if (date && date !== "all") {
                params.date = date;
            }
            const response = await apiClient.get("/interview/sessions", {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            const sessions = response.data?.data ?? [];
            const meta = response.data?.meta ?? null;
            set({ sessions, meta, loading: false, hasLoaded: true });
        },
        submitFeedback: async (dto: any) => {
            const token = getToken();
            if (!token) return;
            await apiClient.post("/feedback/agency/submit", dto, {
                headers: { Authorization: `Bearer ${token}` },
            });
        },
        getFeedback: async (sessionId: number) => {
            const token = getToken();
            if (!token) return null;
            const response = await apiClient.get(`/feedback/agency/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        },
    };
});

