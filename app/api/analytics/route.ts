import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

const INDUSTRY_COLORS = [
	"#1e3a5f",
	"#7c3aed",
	"#f97316",
	"#22c55e",
	"#06b6d4",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#10b981",
	"#ec4899",
];

function monthKey(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date) {
	return d.toLocaleString("en-US", { month: "short" });
}
function round1(n: number) {
	return Math.round(n * 10) / 10;
}
function capitalize(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
function safeRate(num: number, den: number) {
	return den > 0 ? round1((num / den) * 100) : 0;
}

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
	const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

	const [
		// ── KPI: platform growth ────────────────────────────────────────────────
		agenciesLast30,
		agenciesPrev30,
		// ── KPI: user engagement ───────────────────────────────────────────────
		activeSubscriptions,
		totalAgencies,
		// ── KPI: revenue growth (calendar month) ───────────────────────────────
		revenueThisMonth,
		revenueLastMonth,
		// ── Growth trend ───────────────────────────────────────────────────────
		agenciesGrowth,
		candidatesGrowth,
		// ── Job distribution ───────────────────────────────────────────────────
		jobsByIndustry,
		// ── Hiring funnel (all-time) ────────────────────────────────────────────
		totalApplications,
		totalAnalyzed,
		totalSessions,
		acceptedInvitations,
		completedSessions,
		// ── Perf metrics – current period (last 30 days) ───────────────────────
		sessions30,
		completed30,
		apps30,
		accepted30,
		invites30,
		score30,
		revLast30,
		// ── Perf metrics – previous period (30-60 days ago) ────────────────────
		sessionsPrev30,
		completedPrev30,
		appsPrev30,
		acceptedPrev30,
		invitesPrev30,
		scorePrev30,
		revPrev30,
	] = await Promise.all([
		// KPI: platform growth
		prisma.agency.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
		prisma.agency.count({ where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),

		// KPI: user engagement
		prisma.agencySubscription.count({ where: { is_active: true } }),
		prisma.agency.count(),

		// KPI: revenue growth
		prisma.subscriptionTransaction.aggregate({
			_sum: { amount: true },
			where: { status: "COMPLETED", created_at: { gte: thisMonthStart } },
		}),
		prisma.subscriptionTransaction.aggregate({
			_sum: { amount: true },
			where: { status: "COMPLETED", created_at: { gte: lastMonthStart, lt: thisMonthStart } },
		}),

		// Growth trend
		prisma.agency.findMany({
			where: { created_at: { gte: sixMonthsAgo } },
			select: { created_at: true },
		}),
		prisma.candidate.findMany({
			where: { created_at: { gte: sixMonthsAgo } },
			select: { created_at: true },
		}),

		// Job distribution
		prisma.job.groupBy({ by: ["industry"], _count: { id: true } }),

		// Hiring funnel (all-time)
		prisma.jobApplication.count(),
		prisma.resumeAnalysis.count(),
		prisma.interviewSession.count(),
		prisma.invitation.count({
			where: { status: { in: ["accepted", "completed", "scheduled", "offline_scheduled"] } },
		}),
		prisma.interviewSession.count({ where: { status: "completed" } }),

		// Perf – current period
		prisma.interviewSession.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
		prisma.interviewSession.count({
			where: { status: "completed", created_at: { gte: thirtyDaysAgo } },
		}),
		prisma.jobApplication.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
		prisma.invitation.count({
			where: {
				status: { in: ["accepted", "completed", "scheduled", "offline_scheduled"] },
				created_at: { gte: thirtyDaysAgo },
			},
		}),
		prisma.invitation.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
		prisma.resumeAnalysis.aggregate({
			_avg: { score: true },
			where: { created_at: { gte: thirtyDaysAgo } },
		}),
		prisma.subscriptionTransaction.aggregate({
			_sum: { amount: true },
			where: { status: "COMPLETED", created_at: { gte: thirtyDaysAgo } },
		}),

		// Perf – previous period
		prisma.interviewSession.count({
			where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
		}),
		prisma.interviewSession.count({
			where: { status: "completed", created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
		}),
		prisma.jobApplication.count({
			where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
		}),
		prisma.invitation.count({
			where: {
				status: { in: ["accepted", "completed", "scheduled", "offline_scheduled"] },
				created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
			},
		}),
		prisma.invitation.count({ where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
		prisma.resumeAnalysis.aggregate({
			_avg: { score: true },
			where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
		}),
		prisma.subscriptionTransaction.aggregate({
			_sum: { amount: true },
			where: {
				status: "COMPLETED",
				created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
			},
		}),
	]);

	// ── KPIs ─────────────────────────────────────────────────────────────────
	const platformGrowthPct =
		agenciesPrev30 > 0
			? ((agenciesLast30 - agenciesPrev30) / agenciesPrev30) * 100
			: agenciesLast30 > 0
				? 100
				: 0;

	const userEngagementPct = totalAgencies > 0 ? (activeSubscriptions / totalAgencies) * 100 : 0;

	const jobSuccessRatePct =
		totalApplications > 0 ? (completedSessions / totalApplications) * 100 : 0;

	const revenueThis = Number(revenueThisMonth._sum.amount ?? 0);
	const revenueLast = Number(revenueLastMonth._sum.amount ?? 0);
	const revenueGrowthPct =
		revenueLast > 0
			? ((revenueThis - revenueLast) / revenueLast) * 100
			: revenueThis > 0
				? 100
				: 0;

	// ── User growth trend (last 6 months) ────────────────────────────────────
	const months = Array.from({ length: 6 }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
		return { key: monthKey(d), label: monthLabel(d) };
	});

	const agencyByMonth: Record<string, number> = Object.fromEntries(
		months.map((m) => [m.key, 0])
	);
	const candidateByMonth: Record<string, number> = Object.fromEntries(
		months.map((m) => [m.key, 0])
	);

	agenciesGrowth.forEach(({ created_at }) => {
		const k = monthKey(created_at);
		if (k in agencyByMonth) agencyByMonth[k]++;
	});
	candidatesGrowth.forEach(({ created_at }) => {
		const k = monthKey(created_at);
		if (k in candidateByMonth) candidateByMonth[k]++;
	});

	const userGrowthTrend = months.map(({ key, label }) => ({
		month: label,
		companies: agencyByMonth[key],
		candidates: candidateByMonth[key],
	}));

	// ── Job distribution ──────────────────────────────────────────────────────
	const totalJobs = jobsByIndustry.reduce((s, r) => s + r._count.id, 0);
	const sortedIndustries = [...jobsByIndustry].sort((a, b) => b._count.id - a._count.id);
	const top5 = sortedIndustries.slice(0, 5);
	const otherCount = sortedIndustries.slice(5).reduce((s, r) => s + r._count.id, 0);

	const jobDistribution = top5.map((r, i) => ({
		name: capitalize(r.industry),
		value: totalJobs > 0 ? Math.round((r._count.id / totalJobs) * 100) : 0,
		fill: INDUSTRY_COLORS[i] ?? "#94a3b8",
	}));
	if (otherCount > 0) {
		jobDistribution.push({
			name: "Other",
			value: totalJobs > 0 ? Math.round((otherCount / totalJobs) * 100) : 0,
			fill: "#94a3b8",
		});
	}

	// ── Hiring funnel ─────────────────────────────────────────────────────────
	const hiringFunnel = [
		{ stage: "Applications", count: totalApplications },
		{ stage: "Screening", count: totalAnalyzed },
		{ stage: "Interviews", count: totalSessions },
		{ stage: "Offer", count: acceptedInvitations },
		{ stage: "Hired", count: completedSessions },
	];

	// ── Performance metrics – current ─────────────────────────────────────────
	const appResponseRate = safeRate(sessions30, apps30);
	const showRate = safeRate(completed30, sessions30);
	const acceptanceRate = safeRate(accepted30, invites30);
	const qualityScore =
		score30._avg.score != null ? Math.round((score30._avg.score / 10) * 100) / 100 : null;
	const revLast30Num = Number(revLast30._sum.amount ?? 0);
	const costPerHire = completed30 > 0 ? Math.round(revLast30Num / completed30) : null;

	// ── Performance metrics – previous (for trend delta) ─────────────────────
	const appResponseRatePrev = safeRate(sessionsPrev30, appsPrev30);
	const showRatePrev = safeRate(completedPrev30, sessionsPrev30);
	const acceptanceRatePrev = safeRate(acceptedPrev30, invitesPrev30);
	const qualityScorePrev =
		scorePrev30._avg.score != null
			? Math.round((scorePrev30._avg.score / 10) * 100) / 100
			: null;
	const revPrev30Num = Number(revPrev30._sum.amount ?? 0);
	const costPerHirePrev = completedPrev30 > 0 ? Math.round(revPrev30Num / completedPrev30) : null;

	// ── Avg time to hire (raw SQL, period-filtered) ───────────────────────────
	let avgTimeToHireDays: number | null = null;
	let avgTimeToHireDaysPrev: number | null = null;
	try {
		const [curr, prev] = await Promise.all([
			prisma.$queryRaw<[{ avg_days: number | null }]>`
				SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400)::float AS avg_days
				FROM "InterviewSession"
				WHERE status = 'completed' AND created_at >= ${thirtyDaysAgo}
			`,
			prisma.$queryRaw<[{ avg_days: number | null }]>`
				SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400)::float AS avg_days
				FROM "InterviewSession"
				WHERE status = 'completed' AND created_at >= ${sixtyDaysAgo} AND created_at < ${thirtyDaysAgo}
			`,
		]);
		const r1 = curr[0]?.avg_days;
		const r2 = prev[0]?.avg_days;
		avgTimeToHireDays = r1 != null ? Math.round(r1) : null;
		avgTimeToHireDaysPrev = r2 != null ? Math.round(r2) : null;
	} catch {
		avgTimeToHireDays = null;
		avgTimeToHireDaysPrev = null;
	}

	return NextResponse.json({
		data: {
			kpis: {
				platformGrowth: { value: agenciesLast30, pct: round1(platformGrowthPct) },
				userEngagement: { value: activeSubscriptions, pct: round1(userEngagementPct) },
				jobSuccessRate: { value: completedSessions, pct: round1(jobSuccessRatePct) },
				revenueGrowth: { value: revenueThis, pct: round1(revenueGrowthPct) },
			},
			userGrowthTrend,
			jobDistribution,
			hiringFunnel,
			performanceMetrics: {
				avgTimeToHireDays,
				avgTimeToHireDaysPrev,
				applicationResponseRate: appResponseRate,
				applicationResponseRatePrev: appResponseRatePrev,
				interviewShowRate: showRate,
				interviewShowRatePrev: showRatePrev,
				offerAcceptanceRate: acceptanceRate,
				offerAcceptanceRatePrev: acceptanceRatePrev,
				qualityOfHireScore: qualityScore,
				qualityOfHireScorePrev: qualityScorePrev,
				costPerHire,
				costPerHirePrev,
			},
		},
	});
}
