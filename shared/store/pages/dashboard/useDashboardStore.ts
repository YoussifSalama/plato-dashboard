"use client";

import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";
import { BackendApiClient, getAgencyToken } from "../resume/useResumeStore";

// ── Types matching GET /agency/dashboard response ──────────────────────────

export type DashboardMetricStat = {
	value: number;
	trend: number;
};

export type DashboardMetrics = {
	activeJobs: DashboardMetricStat;
	totalCandidates: DashboardMetricStat;
	upcomingInterviews: DashboardMetricStat;
	unreadMessages: DashboardMetricStat;
};

export type DashboardOverviewStat = {
	value: number;
	trend: number;
};

export type DashboardOverview = {
	enquiries: DashboardOverviewStat;
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

export type AdminDashboardData = {
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
	adminDashboard: AdminDashboardData | null;
	loading: boolean;
	getDashboard: (
		accountId?: string | number
	) => Promise<AgencyDashboardData | null>;
	getAdminDashboard: () => Promise<AgencyDashboardData | null>;
	clear: () => void;
}

const useDashboardStore = create<DashboardStore>((set) => ({
	dashboard: null,
	loading: false,
	adminDashboard: null,
	getDashboard: async (accountId) => {
		if (!accountId) return null;
		const token = await getAgencyToken(accountId);
		if (!token) return null;
		set({ loading: true });
		try {
			const response = await BackendApiClient.get("/agency/dashboard", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const dashboard = (response.data?.data ??
				response.data) as AgencyDashboardData;
			set({ dashboard });
			return dashboard;
		} catch {
			set({ dashboard: null });
			return null;
		} finally {
			set({ loading: false });
		}
	},
	getAdminDashboard: async () => {
		set({ loading: true });
		try {
			const response = await apiClient.get("/api/dashboard");
			const adminDashboard = response.data?.data as AgencyDashboardData;
			set({ adminDashboard });
			return adminDashboard;
		} catch {
			set({ adminDashboard: null });
			return null;
		} finally {
			set({ loading: false });
		}
	},
	clear: () => set({ adminDashboard: null, loading: false }),
}));

export default useDashboardStore;
