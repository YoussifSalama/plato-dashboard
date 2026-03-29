import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";

export type InterviewStatistics = {
    total_scheduled: number;
    interviews_today: number;
    interviews_this_week: number;
    completed_interviews: number;
    cancelled_interviews: number;
};

type InterviewStatisticsStore = {
    statistics: InterviewStatistics | null;
    loading: boolean;
    getInterviewStatistics: () => Promise<void>;
};

const getToken = () => {
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

export const useInterviewStatisticsStore = create<InterviewStatisticsStore>((set) => ({
    statistics: null,
    loading: false,
    getInterviewStatistics: async () => {
        set({ loading: true });
        const token = getToken();
        if (!token) {
            set({ loading: false });
            return;
        }
        try {
            const response = await apiClient.get("/interview/statistics", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const statistics = response.data?.data ?? null;
            set({ statistics, loading: false });
        } catch {
            set({ loading: false });
        }
    },
}));
