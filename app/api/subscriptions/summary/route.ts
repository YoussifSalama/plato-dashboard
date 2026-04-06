import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
	const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

	const [
		revenueThisMonth,
		revenueLastMonth,
		activeSubscriptions,
		totalCompanies,
		renewalsThisMonth,
		expiringSoon,
		churnedThisMonth,
		churnedLastMonth,
	] = await Promise.all([
		// Revenue this month (completed transactions)
		prisma.subscriptionTransaction.aggregate({
			_sum: { amount: true },
			where: {
				status: "COMPLETED",
				created_at: { gte: startOfMonth },
			},
		}),
		// Revenue last month
		prisma.subscriptionTransaction.aggregate({
			_sum: { amount: true },
			where: {
				status: "COMPLETED",
				created_at: { gte: startOfLastMonth, lte: endOfLastMonth },
			},
		}),
		// Active subscriptions count
		prisma.agencySubscription.count({ where: { is_active: true } }),
		// Total companies (for context in diff text)
		prisma.agency.count(),
		// Renewals this month: subscriptions that started this month (re-subscribed)
		prisma.agencySubscription.count({
			where: { start_date: { gte: startOfMonth } },
		}),
		// Expiring soon (active, end_date within 30 days)
		prisma.agencySubscription.count({
			where: {
				is_active: true,
				end_date: { gte: now, lte: thirtyDaysFromNow },
			},
		}),
		// Churned this month: became inactive this month
		prisma.agencySubscription.count({
			where: {
				is_active: false,
				updated_at: { gte: startOfMonth },
			},
		}),
		// Churned last month
		prisma.agencySubscription.count({
			where: {
				is_active: false,
				updated_at: { gte: startOfLastMonth, lte: endOfLastMonth },
			},
		}),
	]);

	const thisMonthRevenue = revenueThisMonth._sum.amount ?? 0;
	const lastMonthRevenue = revenueLastMonth._sum.amount ?? 0;

	const revenueGrowthPct =
		lastMonthRevenue === 0
			? 100
			: Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

	// Simple churn rate: churned / (active + churned)
	const totalBase = activeSubscriptions + churnedThisMonth;
	const churnRate =
		totalBase === 0 ? 0 : Math.round((churnedThisMonth / totalBase) * 1000) / 10;
	const prevChurnBase = activeSubscriptions + churnedLastMonth;
	const prevChurnRate =
		prevChurnBase === 0
			? 0
			: Math.round((churnedLastMonth / prevChurnBase) * 1000) / 10;
	const churnDiff = Math.round((churnRate - prevChurnRate) * 10) / 10;

	return NextResponse.json({
		data: {
			monthly_revenue: thisMonthRevenue,
			revenue_growth_pct: revenueGrowthPct,
			active_subscriptions: activeSubscriptions,
			total_companies: totalCompanies,
			renewals_this_month: renewalsThisMonth,
			expiring_soon: expiringSoon,
			churn_rate: churnRate,
			churn_diff: churnDiff,
		},
	});
}
