"use client";

import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";

// ── Types matching GET /agency/dashboard response ──────────────────────────

export type DashboardMetrics = {
    activeJobs: number;
    totalCandidates: number;
    upcomingInterviews: number;
    unreadMessages: number;
};

export type DashboardOverviewStat = {
    value: number;
    trend: number;
};

export type DashboardOverview = {
    totalJobs: DashboardOverviewStat;
    newApplicants: DashboardOverviewStat;
    interviewsScheduled: DashboardOverviewStat;
    hiringSuccessRate: DashboardOverviewStat;
};

export type DashboardWeeklyActivity = {
    day: string;
    applications: number;
    interviews: number;
};

export type DashboardApplicationStatus = {
    stage: string;
    value: number;
};

export type DashboardDeptProgress = {
    department: string;
    currentHired: number;
    targetHires: number;
};

export type DashboardMonthlyGrowthPoint = {
    month: string;
    applications: number;
};

export type DashboardMonthlyGrowth = {
    chartData: DashboardMonthlyGrowthPoint[];
    currentMonth: {
        total: number;
        trend: number;
    };
};

export type DashboardActivity = {
    id: string;
    type: "application" | "interview" | "job" | "offer" | "message";
    title: string;
    description?: string;
    timestamp: string;
};

export type AgencyDashboardData = {
    metrics: DashboardMetrics;
    overview: DashboardOverview;
    weeklyActivity: DashboardWeeklyActivity[];
    applicationStatus: DashboardApplicationStatus[];
    departmentProgress: DashboardDeptProgress[];
    monthlyGrowth: DashboardMonthlyGrowth;
    recentActivities: DashboardActivity[];
};

// ── Store ──────────────────────────────────────────────────────────────────

interface DashboardStore {
    dashboard: AgencyDashboardData | null;
    loading: boolean;
    getDashboard: (accessToken?: string | null) => Promise<AgencyDashboardData | null>;
    clear: () => void;
}

const getToken = (accessToken?: string | null) => {
    if (accessToken) return accessToken;
    return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
};

const useDashboardStore = create<DashboardStore>((set) => ({
    dashboard: null,
    loading: false,
    getDashboard: async (accessToken) => {
        const token = getToken(accessToken);
        if (!token) return null;
        set({ loading: true });
        try {
            const response = await apiClient.get("/agency/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const dashboard = (response.data?.data ?? response.data) as AgencyDashboardData;
            set({ dashboard });
            return dashboard;
        } catch {
            set({ dashboard: null });
            return null;
        } finally {
            set({ loading: false });
        }
    },
    clear: () => set({ dashboard: null, loading: false }),
}));

export default useDashboardStore;
