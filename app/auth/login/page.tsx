"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail } from "lucide-react";
import Cookies from "js-cookie";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import useAuthStore from "@/shared/store/pages/auth/useAuthStore";
import useAgency from "@/shared/store/useAgency";
import { errorToast, successToast } from "@/shared/helper/toast";
import ThemeSwitch from "@/shared/components/layout/theme/ThemeSwitch";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";
import BrandSide from "@/shared/common/pages/auth/BrandSide";
import GoogleSignInButton from "@/shared/components/auth/GoogleSignInButton";
import { Switch } from "@/components/ui/switch";

type LoginFormValues = {
	email: string;
	password: string;
	rememberMe: boolean;
};

type ResetPasswordValues = {
	email: string;
};

const loginSchema = z.object({
	email: z.string().email("Enter a valid email"),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean(),
});

const resetSchema = z.object({
	email: z.string().email("Enter a valid email"),
});

const LoginPage = () => {
	const {
		login,
		loginWithGoogle,
		loadingLogin,
		requestPasswordReset,
		storeTokens,
	} = useAuthStore();
	const { getMyAgencyAccountData } = useAgency();
	const router = useRouter();
	const [isResetOpen, setIsResetOpen] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isValid, isDirty },
	} = useForm<LoginFormValues>({
		defaultValues: { email: "", password: "", rememberMe: false },
		mode: "onChange",
		resolver: zodResolver(loginSchema),
	});

	const rememberMe = watch("rememberMe");

	const {
		register: registerReset,
		handleSubmit: handleSubmitReset,
		formState: {
			errors: resetErrors,
			isValid: isResetValid,
			isDirty: isResetDirty,
			isSubmitting: isResetSubmitting,
		},
		reset: resetResetForm,
	} = useForm<ResetPasswordValues>({
		defaultValues: { email: "" },
		mode: "onChange",
		resolver: zodResolver(resetSchema),
	});

	useEffect(() => {
		const rememberedEmail = localStorage.getItem("remembered_email");
		if (rememberedEmail) {
			setValue("email", rememberedEmail, { shouldValidate: true });
			setValue("rememberMe", true);
		}

		const token =
			typeof window !== "undefined"
				? (Cookies.get(ACCESS_TOKEN_KEY) ?? null)
				: null;
		if (!token) return;
		const checkStatus = async () => {
			const account = await getMyAgencyAccountData(token);
			if (account?.agencyId) {
				router.push("/");
			} else {
				router.push("/auth/overview");
			}
		};
		checkStatus();
	}, [getMyAgencyAccountData, router]);

	const onSubmit = async ({ email, password, rememberMe }: LoginFormValues) => {
		const result = await login(email, password, { storeTokens: false });
		if (!result?.access_token) return;

		if (rememberMe) {
			localStorage.setItem("remembered_email", email);
		} else {
			localStorage.removeItem("remembered_email");
		}

		const account = await getMyAgencyAccountData(result.access_token);
		storeTokens(result.access_token, result.refresh_token);
		if (account?.agencyId) {
			router.push("/");
		} else {
			router.push("/auth/overview");
		}
	};

	const onResetSubmit = async ({ email }: ResetPasswordValues) => {
		const sent = await requestPasswordReset(email);
		if (sent) {
			successToast("OTP sent. Check your email for the 6-digit code.");
			resetResetForm();
			setIsResetOpen(false);
			router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
		} else {
			errorToast("Failed to send reset OTP. Please try again.");
		}
	};

	const handleGoogleSuccess = useCallback(
		async (idToken: string) => {
			const result = await loginWithGoogle(idToken, { storeTokens: false });
			if (!result?.access_token) return;
			storeTokens(result.access_token, result.refresh_token);
			if (result.is_new_user) {
				router.push("/auth/overview");
				return;
			}
			const account = await getMyAgencyAccountData(result.access_token);
			if (account?.agencyId) {
				router.push("/");
			} else {
				router.push("/auth/overview");
			}
		},
		[loginWithGoogle, getMyAgencyAccountData, storeTokens, router]
	);

	return (
		<div className="light-neutral-scope">
			<section className="flex min-h-screen">
				<div className="relative flex flex-1 flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-950 dark:via-slate-950 dark:to-[#001728]">
					{/* Mobile navbar - hidden on lg+ */}
					<div className="flex items-center justify-between px-5 py-4 lg:hidden">
						<div className="flex items-center gap-2.5">
							<Image
								src="/assets/page/auth/logo.png"
								alt="Plato logo"
								width={32}
								height={32}
								className="object-contain"
							/>
							<span className="font-bold text-base uppercase tracking-wide text-blue-700 dark:text-blue-300">
								Plato Agency
							</span>
						</div>
						<ThemeSwitch />
					</div>

					{/* Desktop theme switch - hidden on mobile */}
					<div className="absolute right-6 top-6 hidden lg:block">
						<ThemeSwitch />
					</div>

					{/* Form area */}
					<div className="flex flex-1 items-center justify-center px-4 py-8 lg:py-10">
						<div className="w-full max-w-md rounded-md border border-blue-200 max-lg:bg-white p-6 shadow-xl shadow-blue-200/60 dark:border-slate-700/60 dark:bg-slate-900 dark:shadow-none lg:border-0 lg:bg-transparent lg:shadow-none lg:dark:bg-transparent">
							<div>
								<h1 className="text-2xl font-bold text-[#005CA9] dark:text-blue-300">
									Welcome Back
								</h1>
								<p className="mt-1 text-sm text-blue-600 dark:text-slate-300">
									Sign in to your account to access your employer dashboard
								</p>
							</div>

							<form
								className="mt-6 space-y-4"
								onSubmit={handleSubmit(onSubmit)}
							>
								<div className="space-y-2">
									<label className="text-sm font-medium text-blue-700 dark:text-slate-200">
										Email
									</label>
									<div className="relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-500 dark:text-slate-300" />
										<Input
											type="email"
											placeholder="Enter your email"
											autoComplete="email"
											className="pl-9 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-400"
											{...register("email")}
										/>
									</div>
									{errors.email && (
										<p className="text-xs text-red-500">
											{errors.email.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium text-blue-700 dark:text-slate-200">
										Password
									</label>
									<div className="relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-500 dark:text-slate-300" />
										<Input
											type="password"
											placeholder="Enter your password"
											autoComplete="current-password"
											className="pl-9 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-400"
											{...register("password")}
										/>
									</div>
									{errors.password && (
										<p className="text-xs text-red-500">
											{errors.password.message}
										</p>
									)}
								</div>

								<div className="flex items-center justify-between py-2">
									<div className="flex items-center gap-3">
										<Switch
											checked={rememberMe}
											onChange={(val) =>
												setValue("rememberMe", val, { shouldDirty: true })
											}
										/>
										<span className="text-sm font-medium text-blue-700 dark:text-slate-200">
											Remember me
										</span>
									</div>

									<Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
										<DialogTrigger asChild>
											<button
												type="button"
												className="text-sm text-slate-600 hover:underline dark:text-blue-400"
											>
												Forgot your password?
											</button>
										</DialogTrigger>
										<DialogContent className="max-w-md">
											<DialogHeader>
												<DialogTitle>Reset your password</DialogTitle>
												<DialogDescription>
													Enter your email address and we&apos;ll send you a
													link to reset your password.
												</DialogDescription>
											</DialogHeader>
											<form
												className="mt-4 space-y-4"
												onSubmit={handleSubmitReset(onResetSubmit)}
											>
												<div className="space-y-2">
													<label className="text-sm font-medium text-slate-700 dark:text-slate-200">
														Email address
													</label>
													<div className="relative">
														<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
														<Input
															type="email"
															placeholder="Enter your email address"
															autoComplete="email"
															className="pl-9 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-400"
															{...registerReset("email")}
														/>
													</div>
													{resetErrors.email && (
														<p className="text-xs text-red-500">
															{resetErrors.email.message}
														</p>
													)}
												</div>
												<Button
													type="submit"
													disabled={
														!isResetValid || !isResetDirty || isResetSubmitting
													}
													className="w-full rounded-[10px] bg-main-LebaneseBlue hover:bg-main-LebaneseBlue/80"
												>
													{isResetSubmitting ? "Sending..." : "Send reset OTP"}
												</Button>
											</form>
										</DialogContent>
									</Dialog>
								</div>

								<Button
									type="submit"
									disabled={loadingLogin || !isValid || !isDirty}
									className="w-full uppercase h-12 rounded-[10px] bg-main-LebaneseBlue hover:bg-main-LebaneseBlue/80"
								>
									{loadingLogin ? "Signing in..." : "Sign In"}
								</Button>
							</form>

							<div className="mt-6 flex items-center gap-3 text-xs text-blue-500 dark:text-slate-400">
								<span className="h-px flex-1 bg-blue-200 dark:bg-slate-700" />
								OR CONTINUE WITH
								<span className="h-px flex-1 bg-blue-200 dark:bg-slate-700" />
							</div>

							<GoogleSignInButton
								clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_AGENCY ?? ""}
								onSuccess={handleGoogleSuccess}
								onError={(msg) => errorToast(msg)}
								className="mt-4 flex justify-center"
							/>

							<p className="mt-6 text-center text-sm text-blue-600 dark:text-slate-300">
								Don&apos;t have an account?{" "}
								<Link
									href="/auth/signup"
									className="text-main-LebaneseBlue hover:underline font-bold"
								>
									Sign up here
								</Link>
							</p>
						</div>
					</div>
				</div>

				<BrandSide />
			</section>
		</div>
	);
};

export default LoginPage;
