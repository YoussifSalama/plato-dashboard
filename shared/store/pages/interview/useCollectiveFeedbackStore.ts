import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";

export type CollectiveFeedbackItem = {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    candidate: {
        name: string;
        image_url: string | null;
    };
    job_title: string;
    session_id: number;
};

export type CollectiveFeedbackMeta = {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
};

type CollectiveFeedbackStore = {
    feedbacks: CollectiveFeedbackItem[];
    meta: CollectiveFeedbackMeta | null;
    loading: boolean;
    getCollectiveFeedbacks: (page: number) => Promise<void>;
};

const getToken = () => {
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

export const useCollectiveFeedbackStore = create<CollectiveFeedbackStore>((set) => ({
    feedbacks: [],
    meta: null,
    loading: false,
    getCollectiveFeedbacks: async (page: number) => {
        set({ loading: true });
        const token = getToken();
        if (!token) {
            set({ loading: false });
            return;
        }
        try {
            const response = await apiClient.get("/feedback/agency/all", {
                headers: { Authorization: `Bearer ${token}` },
                params: { page, limit: 10 },
            });
            set({
                feedbacks: response.data?.items ?? [],
                meta: response.data?.meta ?? null,
                loading: false,
            });
        } catch (error) {
            console.error("Failed to fetch collective feedback:", error);
            set({ loading: false });
        }
    },
}));
