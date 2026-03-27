"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/authTokens";
const normalizeBaseUrl = (value?: string) => (value ?? "").replace(/\/+$/, "");
const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
const AGENCY_REFRESH_URL = API_BASE_URL
	? `${API_BASE_URL}/agency/token/refresh`
	: "/agency/token/refresh";

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

// let isRefreshing = false;
// let refreshQueue: Array<(token?: string) => void> = [];

// const runRefreshQueue = (token?: string) => {
// 	refreshQueue.forEach((cb) => cb(token));
// 	refreshQueue = [];
// };

// apiClient.interceptors.response.use(
// 	(response) => response,
// 	async (error) => {
// 		const originalRequest = error.config;
// 		const status = error.response?.status;
// 		const data = error.response?.data;

// 		// 403, 498, 409: both tokens revoked/expired — immediate logout
// 		if (status === 403 || status === 498 || status === 409) {
// 			clearAuthTokens();
// 			redirectToLogin();
// 			return Promise.reject(error);
// 		}

// 		// 401 only: try refresh (access token expired, refresh may still be valid)
// 		const shouldRefresh = status === 401;
// 		if (
// 			!shouldRefresh ||
// 			originalRequest?._retry ||
// 			originalRequest?.url?.includes("/agency/token/refresh")
// 		) {
// 			return Promise.reject(error);
// 		}

// 		originalRequest._retry = true;

// 		if (isRefreshing) {
// 			return new Promise((resolve, reject) => {
// 				refreshQueue.push((token?: string) => {
// 					if (!token) {
// 						reject(error);
// 						return;
// 					}
// 					const headers = originalRequest.headers ?? {};
// 					if (
// 						typeof (headers as { set?: (key: string, value: string) => void })
// 							.set === "function"
// 					) {
// 						(headers as { set: (key: string, value: string) => void }).set(
// 							"Authorization",
// 							`Bearer ${token}`
// 						);
// 					} else {
// 						(headers as Record<string, string>).Authorization =
// 							`Bearer ${token}`;
// 					}
// 					originalRequest.headers = headers;
// 					resolve(apiClient(originalRequest));
// 				});
// 			});
// 		}

// 		isRefreshing = true;
// 		try {
// 			const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
// 			if (!refreshToken) {
// 				runRefreshQueue();
// 				clearAuthTokens();
// 				redirectToLogin();
// 				return Promise.reject(error);
// 			}
// 			const refreshResponse = await axios.post(AGENCY_REFRESH_URL, {
// 				refresh_token: refreshToken,
// 			});
// 			const newAccessToken =
// 				refreshResponse.data?.access_token ??
// 				refreshResponse.data?.data?.access_token;
// 			if (newAccessToken) {
// 				Cookies.set(ACCESS_TOKEN_KEY, newAccessToken);
// 				runRefreshQueue(newAccessToken);
// 				const headers = originalRequest.headers ?? {};
// 				if (
// 					typeof (headers as { set?: (key: string, value: string) => void })
// 						.set === "function"
// 				) {
// 					(headers as { set: (key: string, value: string) => void }).set(
// 						"Authorization",
// 						`Bearer ${newAccessToken}`
// 					);
// 				} else {
// 					(headers as Record<string, string>).Authorization =
// 						`Bearer ${newAccessToken}`;
// 				}
// 				originalRequest.headers = headers;
// 				return apiClient(originalRequest);
// 			}
// 			runRefreshQueue();
// 			return Promise.reject(error);
// 		} catch (refreshError) {
// 			runRefreshQueue();
// 			clearAuthTokens();
// 			redirectToLogin();
// 			return Promise.reject(refreshError);
// 		} finally {
// 			isRefreshing = false;
// 		}
// 	}
// );

export { apiClient };
