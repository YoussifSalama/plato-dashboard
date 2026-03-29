"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/shared/components/layout/sidebar/Sidebar";
import Navbar from "@/shared/components/layout/navbar/Navbar";
import clsx from "clsx";
import LoadingScreen from "@/shared/components/common/LoadingScreen";
import useDashboardStore from "@/shared/store/pages/dashboard/useDashboardStore";
import SubscriptionAlerts from "@/shared/components/layout/SubscriptionAlerts";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const pathname = usePathname();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	// const {
	// 	account,
	// 	agencyStatus,
	// 	loadingAgencyStatus,
	// 	getMyAgencyAccountData,
	// 	getAgencyStatus,
	// } = useAgency();
	const { loading: loadingDashboard, dashboard } = useDashboardStore();
	// const { getSubscription, getPlans, subscription, loadingSubscription } =
	// 	useSubscriptionStore();

	// useEffect(() => {
	// 	if (!account) {
	// 		getMyAgencyAccountData();
	// 	}
	// }, [account, getMyAgencyAccountData]);

	// useEffect(() => {
	// 	getAgencyStatus();
	// }, [getAgencyStatus]);

	// const shouldBlock = useMemo(() => {
	// 	if (!agencyStatus || loadingAgencyStatus) return false;
	// 	return !agencyStatus.hasAgency;
	// }, [agencyStatus, loadingAgencyStatus]);

	// SCENARIO 1: Has never checked out a subscription
	// const needToCheckout =
	// 	!isSubscriptionLoading && agencyStatus?.hasAgency && !subscription;
	// const isBillingExemptRoute =
	// 	pathname.startsWith("/billing") ||
	// 	pathname.startsWith("/settings") ||
	// 	pathname.startsWith("/help-center");
	// const requiresBillingRedirect = needToCheckout && !isBillingExemptRoute;

	// SCENARIO 2: Subscription expired / cancelled
	// const isSubscriptionExpired =
	// 	!isSubscriptionLoading &&
	// 	agencyStatus?.hasAgency &&
	// 	subscription &&
	// 	!subscription.is_active;

	// // SCENARIO 3: Active but in Free Trial
	// const isTrialing =
	// 	!isSubscriptionLoading &&
	// 	agencyStatus?.hasAgency &&
	// 	subscription &&
	// 	subscription.is_active &&
	// 	subscription.trial_end_date;

	// useEffect(() => {
	// 	if (!shouldBlock) return;
	// 	if (pathname.startsWith("/settings")) return;
	// 	router.push("/settings");
	// }, [pathname, router, shouldBlock]);

	// useEffect(() => {
	// 	if (!requiresBillingRedirect) return;
	// 	router.replace("/billing");
	// }, [router, requiresBillingRedirect]);

	return (
		<div
			className={clsx(
				"flex min-h-dvh bg-[#F2F4F6] text-foreground light-neutral-scope",
				"dark:bg-linear-to-br dark:from-slate-950 dark:to-slate-900",
				"overflow-hidden"
			)}
		>
			<Sidebar
				isOpen={sidebarOpen}
				isCollapsed={sidebarCollapsed}
				onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
			/>
			{/* <div className="p-4 bg-green-300 w-fit">
			</div> */}
			{sidebarOpen && (
				<button
					type="button"
					aria-label="Close sidebar"
					onClick={() => setSidebarOpen(false)}
					className="fixed inset-0 z-30 bg-black/40 lg:hidden"
				/>
			)}
			<main
				className={clsx(
					"flex-1 min-w-0 overflow-x-hidden px-8 py-6 transition-[margin] duration-300",
					sidebarCollapsed ? "lg:ml-0" : "lg:ml-72"
				)}
			>
				<Navbar onMenuClick={() => setSidebarOpen(true)} />
				<div className="mt-6">{children}</div>
			</main>
			<LoadingScreen
				isVisible={pathname === "/" && !dashboard && loadingDashboard}
			/>
		</div>
	);
};

export default DashboardLayout;
