import Cookies from "js-cookie";
import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/authTokens";
import { errorToast, successToast } from "@/shared/helper/toast";
import {
	resolveErrorMessage,
	resolveResponseMessage,
} from "@/shared/helper/apiMessages";

interface IAuthStore {
	isAuthenticated: boolean;
	loadingLogin: boolean;
	loadingResetRequest: boolean;
	loadingResetVerify: boolean;
	loadingResetConfirm: boolean;
	login: (
		email: string,
		password: string,
		options?: { storeTokens?: boolean }
	) => Promise<{ access_token: string; refresh_token?: string } | null>;
	storeTokens: (
		accessToken?: string | null,
		refreshToken?: string | null
	) => void;
	logout: () => Promise<void>;
	requestPasswordReset: (email: string) => Promise<boolean>;
	verifyPasswordResetOtp: (email: string, otp: string) => Promise<boolean>;
	resetPassword: (
		email: string,
		otp: string,
		newPassword: string
	) => Promise<boolean>;
	verifyAccountToken: (token: string) => Promise<boolean>;
	resendVerificationToken: (token: string) => Promise<boolean>;
}

const useAuthStore = create<IAuthStore>((set) => {
	const persistTokens = (
		accessToken?: string | null,
		refreshToken?: string | null
	) => {
		if (accessToken) {
			Cookies.set(ACCESS_TOKEN_KEY, accessToken);
			localStorage.setItem("access_token", accessToken);
		}
		if (refreshToken) {
			Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
				expires: 7,
			});
			localStorage.setItem("refresh_token", refreshToken);
		}
	};

	return {
		isAuthenticated: false,
		loadingLogin: false,
		loadingSignup: false,
		loadingResetRequest: false,
		loadingResetVerify: false,
		loadingResetConfirm: false,
		storeTokens: (accessToken, refreshToken) => {
			if (typeof window === "undefined") return;
			persistTokens(accessToken ?? null, refreshToken ?? null);
		},
		login: async (email, password, options) => {
			set({ loadingLogin: true });
			try {
				const result = await apiClient.post("/api/admin/auth/login", {
					email,
					password,
				});
				if (result.status === 200) {
					set({ isAuthenticated: true });
					const accessToken =
						result.data?.access_token ?? result.data?.data?.access_token;
					const refreshToken =
						result.data?.refresh_token ?? result.data?.data?.refresh_token;
					const shouldStore = options?.storeTokens !== false;
					if (shouldStore && typeof window !== "undefined") {
						persistTokens(accessToken ?? null, refreshToken ?? null);
					}
					successToast(
						resolveResponseMessage(result, "Signed in successfully.")
					);
					return {
						access_token: accessToken ?? "",
						refresh_token: refreshToken,
					};
				}
				return null;
			} catch (error) {
				errorToast(resolveErrorMessage(error, "Login failed."));
				return null;
			} finally {
				set({ loadingLogin: false });
			}
		},
		requestPasswordReset: async (email) => {
			set({ loadingResetRequest: true });
			try {
				await apiClient.post("/agency/password/reset/request", { email });
				return true;
			} catch (error) {
				errorToast(resolveErrorMessage(error, "Failed to send reset OTP."));
				return false;
			} finally {
				set({ loadingResetRequest: false });
			}
		},
		verifyPasswordResetOtp: async (email, otp) => {
			set({ loadingResetVerify: true });
			try {
				const result = await apiClient.post("/agency/password/reset/verify", {
					email,
					otp,
				});
				const isValid = Boolean(result.data?.valid ?? result.data?.data?.valid);
				if (!isValid) {
					errorToast(resolveResponseMessage(result, "Invalid or expired OTP."));
				}
				return isValid;
			} catch (error) {
				errorToast(resolveErrorMessage(error, "Failed to verify OTP."));
				return false;
			} finally {
				set({ loadingResetVerify: false });
			}
		},
		resetPassword: async (email, otp, newPassword) => {
			set({ loadingResetConfirm: true });
			try {
				await apiClient.post("/agency/password/reset/confirm", {
					email,
					otp,
					newPassword,
				});
				return true;
			} catch (error) {
				errorToast(resolveErrorMessage(error, "Failed to reset password."));
				return false;
			} finally {
				set({ loadingResetConfirm: false });
			}
		},
		verifyAccountToken: async (token) => {
			try {
				const result = await apiClient.post("/agency/verify-account/confirm", {
					token,
				});
				const isValid = Boolean(result.data?.data?.valid ?? result.data?.valid);
				if (isValid) {
					successToast(
						resolveResponseMessage(
							result,
							"Account verified. Your data is saved."
						)
					);
				} else {
					errorToast(
						resolveResponseMessage(
							result,
							"Invalid or expired verification link."
						)
					);
				}
				return isValid;
			} catch (error) {
				errorToast(resolveErrorMessage(error, "Failed to verify account."));
				return false;
			}
		},
		resendVerificationToken: async (token) => {
			try {
				const result = await apiClient.post("/agency/resend-verification", {
					token,
				});
				successToast(
					resolveResponseMessage(result, "Verification email sent.")
				);
				return true;
			} catch (error) {
				errorToast(
					resolveErrorMessage(error, "Failed to resend verification email.")
				);
				return false;
			}
		},
		logout: async () => {
			try {
				const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
				if (refreshToken) {
					await apiClient.post("/api/admin/auth/logout", {
						refresh_token: refreshToken,
					});
				}
			} catch {
				// ignore logout failures
			} finally {
				Cookies.remove(ACCESS_TOKEN_KEY);
				Cookies.remove(REFRESH_TOKEN_KEY);
				if (typeof window !== "undefined") {
					localStorage.removeItem("access_token");
					localStorage.removeItem("refresh_token");
					window.location.href = "/auth/login";
				}
			}
		},
	};
});
export default useAuthStore;
