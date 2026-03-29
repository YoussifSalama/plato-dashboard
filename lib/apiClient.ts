"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/authTokens";

const normalizeBaseUrl = (value?: string) => (value ?? "").replace(/\/+$/, "");
const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
const ADMIN_REFRESH_URL = API_BASE_URL
	? `${API_BASE_URL}/api/admin/auth/refresh`
	: "/api/admin/auth/refresh";

const apiClient = axios.create({
	baseURL: API_BASE_URL || undefined,
});

const clearAuthTokens = () => {
	Cookies.remove(ACCESS_TOKEN_KEY);
	Cookies.remove(REFRESH_TOKEN_KEY);
	if (typeof window !== "undefined") {
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
	}
};

const redirectToLogin = () => {
	if (typeof window !== "undefined") {
		window.location.href = "/auth/login";
	}
};

// ── Request: inject Bearer token ──────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
	const token = Cookies.get(ACCESS_TOKEN_KEY);
	if (token) {
		const headers = config.headers ?? {};
		if (
			typeof (headers as { set?: (key: string, value: string) => void }).set ===
			"function"
		) {
			(headers as { set: (key: string, value: string) => void }).set(
				"Authorization",
				`Bearer ${token}`
			);
		} else {
			(headers as Record<string, string>).Authorization = `Bearer ${token}`;
		}
		config.headers = headers;
	}
	return config;
});

// ── Response: auto-refresh on 401 ────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token?: string) => void> = [];

const runRefreshQueue = (token?: string) => {
	refreshQueue.forEach((cb) => cb(token));
	refreshQueue = [];
};

const setAuthHeader = (
	headers: Record<string, unknown>,
	token: string
) => {
	if (typeof (headers as { set?: (k: string, v: string) => void }).set === "function") {
		(headers as { set: (k: string, v: string) => void }).set(
			"Authorization",
			`Bearer ${token}`
		);
	} else {
		(headers as Record<string, string>).Authorization = `Bearer ${token}`;
	}
};

apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config as typeof error.config & {
			_retry?: boolean;
		};
		const status = error.response?.status;

		// Hard failures — both tokens gone, send to login immediately
		if (status === 403 || status === 409) {
			clearAuthTokens();
			redirectToLogin();
			return Promise.reject(error);
		}

		// 401: access token expired — attempt refresh
		const shouldRefresh = status === 401;
		if (
			!shouldRefresh ||
			originalRequest?._retry ||
			originalRequest?.url?.includes("/api/admin/auth/refresh")
		) {
			return Promise.reject(error);
		}

		originalRequest._retry = true;

		// Queue concurrent requests while a refresh is in-flight
		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				refreshQueue.push((token?: string) => {
					if (!token) {
						reject(error);
						return;
					}
					const headers = originalRequest.headers ?? {};
					setAuthHeader(headers as Record<string, unknown>, token);
					originalRequest.headers = headers;
					resolve(apiClient(originalRequest));
				});
			});
		}

		isRefreshing = true;
		try {
			const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
			if (!refreshToken) {
				runRefreshQueue();
				clearAuthTokens();
				redirectToLogin();
				return Promise.reject(error);
			}

			const refreshResponse = await axios.post(ADMIN_REFRESH_URL, {
				refresh_token: refreshToken,
			});

			const newAccessToken =
				refreshResponse.data?.data?.access_token ??
				refreshResponse.data?.access_token;

			if (newAccessToken) {
				Cookies.set(ACCESS_TOKEN_KEY, newAccessToken);
				if (typeof window !== "undefined") {
					localStorage.setItem("access_token", newAccessToken);
				}
				runRefreshQueue(newAccessToken);
				const headers = originalRequest.headers ?? {};
				setAuthHeader(headers as Record<string, unknown>, newAccessToken);
				originalRequest.headers = headers;
				return apiClient(originalRequest);
			}

			runRefreshQueue();
			clearAuthTokens();
			redirectToLogin();
			return Promise.reject(error);
		} catch (refreshError) {
			runRefreshQueue();
			clearAuthTokens();
			redirectToLogin();
			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	}
);

export { apiClient };
