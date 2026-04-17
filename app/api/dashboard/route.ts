import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

// ── Date helpers ────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
	return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function calcTrend(current: number, previous: number): number {
	if (previous === 0) return current > 0 ? 100 : 0;
	return ((current - previous) / previous) * 100;
}

const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_LABEL: Record<string, string> = {
	active: "Active",
	completed: "Completed",
	inactive: "Review",
	cancelled: "Cancelled",
	postponed: "Postponed",
	ended: "Ended",
};

// ── GET /api/dashboard ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const now = new Date();
	const d7 = daysAgo(7);
	const d14 = daysAgo(14);
	const d30 = daysAgo(30);
	const d60 = daysAgo(60);
	const d180 = daysAgo(180);

	// ── Parallel data fetching ──────────────────────────────────────────────

	const [
		// ── Metric cards (current values) ──
		activeJobsCount,
		totalCandidatesCount,
		unreadMessagesCount,
		upcomingInterviewsCount,

		// ── Metric card trends (new items: last 7d vs prev 7d) ──
		newJobsLast7,
		newJobsPrev7,
		newCandidatesLast7,
		newCandidatesPrev7,
		newInterviewsLast7,
		newInterviewsPrev7,
		newInboxLast7,
		newInboxPrev7,

		// ── Overview — current 30-day window ──
		newResumesCurrent,
		newInterviewsCurrent,
		newJobsCurrent,

		// ── Overview — previous 30-day window (trend) ──
		newResumesPrev,
		newInterviewsPrev30,
		newJobsPrev30,

		// ── Hiring success rate ──
		completedInterviews,
		totalInterviews,

		// ── Weekly activity ──
		weeklyResumes,
		weeklyInterviewSessions,

		// ── Application status distribution ──
		interviewStatusGroups,

		// ── Department progress ──
		activeJobsByIndustry,
		inactiveJobsByIndustry,

		// ── Monthly growth ──
		monthlyResumes,

		// ── Recent activities ──
		recentJobs,
		recentResumes,
		recentInterviewSessions,
	] = await Promise.all([
		// ── Metric card current values ──
		prisma.job.count({ where: { is_active: true } }),
		prisma.candidate.count(),
		prisma.adminInbox.count({ where: { status: "unread" } }),
		prisma.interviewSession.count({ where: { status: "active" } }),

		// ── Metric card trends ──
		prisma.job.count({ where: { created_at: { gte: d7 } } }),
		prisma.job.count({ where: { created_at: { gte: d14, lt: d7 } } }),
		prisma.candidate.count({ where: { created_at: { gte: d7 } } }),
		prisma.candidate.count({ where: { created_at: { gte: d14, lt: d7 } } }),
		prisma.interviewSession.count({ where: { created_at: { gte: d7 } } }),
		prisma.interviewSession.count({
			where: { created_at: { gte: d14, lt: d7 } },
		}),
		prisma.adminInbox.count({
			where: { status: "unread", created_at: { gte: d7 } },
		}),
		prisma.adminInbox.count({
			where: { status: "unread", created_at: { gte: d14, lt: d7 } },
		}),

		// ── Overview current 30-day ──
		prisma.resume.count({ where: { created_at: { gte: d30 } } }),
		prisma.interviewSession.count({ where: { created_at: { gte: d30 } } }),
		prisma.job.count({ where: { created_at: { gte: d30 } } }),

		// ── Overview previous 30-day ──
		prisma.resume.count({ where: { created_at: { gte: d60, lt: d30 } } }),
		prisma.interviewSession.count({
			where: { created_at: { gte: d60, lt: d30 } },
		}),
		prisma.job.count({ where: { created_at: { gte: d60, lt: d30 } } }),

		// ── Hiring success rate ──
		prisma.interviewSession.count({ where: { status: "completed" } }),
		prisma.interviewSession.count(),

		// ── Weekly activity ──
		prisma.resume.findMany({
			where: { created_at: { gte: d7 } },
			select: { created_at: true },
		}),
		prisma.interviewSession.findMany({
			where: { created_at: { gte: d7 } },
			select: { created_at: true },
		}),

		// ── Application status ──
		prisma.interviewSession.groupBy({
			by: ["status"],
			_count: { status: true },
		}),

		// ── Department progress ──
		prisma.job.groupBy({
			by: ["industry"],
			where: { is_active: true },
			_count: { id: true },
			orderBy: { _count: { id: "desc" } },
			take: 6,
		}),
		prisma.job.groupBy({
			by: ["industry"],
			where: { is_active: false },
			_count: { id: true },
		}),

		// ── Monthly growth ──
		prisma.resume.findMany({
			where: { created_at: { gte: d180 } },
			select: { created_at: true },
		}),

		// ── Recent activities ──
		prisma.job.findMany({
			take: 4,
			orderBy: { created_at: "desc" },
			select: {
				id: true,
				title: true,
				created_at: true,
				agency: { select: { company_name: true } },
			},
		}),
		prisma.resume.findMany({
			take: 4,
			orderBy: { created_at: "desc" },
			select: {
				id: true,
				name: true,
				created_at: true,
				job: { select: { title: true } },
			},
		}),
		prisma.interviewSession.findMany({
			take: 4,
			orderBy: { created_at: "desc" },
			select: { id: true, status: true, created_at: true },
		}),
	]);

	// ── Build weekly activity ───────────────────────────────────────────────

	const weeklyData = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(now);
		d.setDate(d.getDate() - (6 - i));
		return {
			day: DAY_NAMES[d.getDay()],
			date: d.toDateString(),
			applications: 0,
			interviews: 0,
		};
	});
	weeklyResumes.forEach((r) => {
		const entry = weeklyData.find(
			(d) => d.date === new Date(r.created_at).toDateString()
		);
		if (entry) entry.applications++;
	});
	weeklyInterviewSessions.forEach((s) => {
		const entry = weeklyData.find(
			(d) => d.date === new Date(s.created_at).toDateString()
		);
		if (entry) entry.interviews++;
	});

	// ── Build monthly growth ────────────────────────────────────────────────

	const monthlyMap = new Map<string, number>();
	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		monthlyMap.set(`${MONTH_NAMES[d.getMonth()]}|${d.getFullYear()}`, 0);
	}
	monthlyResumes.forEach((r) => {
		const d = new Date(r.created_at);
		const key = `${MONTH_NAMES[d.getMonth()]}|${d.getFullYear()}`;
		if (monthlyMap.has(key))
			monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
	});
	const monthlyChartData = Array.from(monthlyMap.entries()).map(
		([key, count]) => ({
			month: key.split("|")[0],
			applications: count,
		})
	);
	const currentMonthTotal = monthlyChartData.at(-1)?.applications ?? 0;
	const prevMonthTotal = monthlyChartData.at(-2)?.applications ?? 0;

	// ── Build department progress ───────────────────────────────────────────

	const inactiveMap = new Map(
		inactiveJobsByIndustry.map((g) => [g.industry, g._count.id])
	);
	const departmentProgress = activeJobsByIndustry.map((g) => {
		const active = g._count.id;
		const filled = inactiveMap.get(g.industry) ?? 0;
		return {
			department:
				g.industry.charAt(0).toUpperCase() +
				g.industry.slice(1).replace(/_/g, " "),
			currentHired: filled,
			targetHires: active + filled,
		};
	});

	// ── Build recent activities ─────────────────────────────────────────────

	const activities = [
		...recentJobs.map((j) => ({
			id: `job-${j.id}`,
			type: "job" as const,
			title: `Job posted: ${j.title}`,
			description: j.agency?.company_name ?? undefined,
			timestamp: j.created_at.toISOString(),
		})),
		...recentResumes.map((r) => ({
			id: `resume-${r.id}`,
			type: "application" as const,
			title: `New application: ${r.job?.title ?? "Unknown Job"}`,
			description: r.name,
			timestamp: r.created_at.toISOString(),
		})),
		...recentInterviewSessions.map((s) => ({
			id: `interview-${s.id}`,
			type: "interview" as const,
			title: `Interview ${STATUS_LABEL[s.status]?.toLowerCase() ?? s.status}`,
			timestamp: s.created_at.toISOString(),
		})),
	]
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		)
		.slice(0, 10);

	// ── Compose response ────────────────────────────────────────────────────

	const hiringSuccessRate =
		totalInterviews > 0 ? completedInterviews / totalInterviews : 0;

	return NextResponse.json({
		data: {
			metrics: {
				activeJobs: {
					value: activeJobsCount,
					trend: calcTrend(newJobsLast7, newJobsPrev7),
				},
				totalCandidates: {
					value: totalCandidatesCount,
					trend: calcTrend(newCandidatesLast7, newCandidatesPrev7),
				},
				upcomingInterviews: {
					value: upcomingInterviewsCount,
					trend: calcTrend(newInterviewsLast7, newInterviewsPrev7),
				},
				unreadMessages: {
					value: unreadMessagesCount,
					trend: calcTrend(newInboxLast7, newInboxPrev7),
				},
			},
			overview: {
				enquiries: {
					value: newJobsCurrent,
					trend: calcTrend(newJobsCurrent, newJobsPrev30),
				},
				newApplicants: {
					value: newResumesCurrent,
					trend: calcTrend(newResumesCurrent, newResumesPrev),
				},
				interviewsScheduled: {
					value: newInterviewsCurrent,
					trend: calcTrend(newInterviewsCurrent, newInterviewsPrev30),
				},
				hiringSuccessRate: {
					value: hiringSuccessRate,
					trend: 0,
				},
			},
			weeklyActivity: weeklyData.map(({ day, applications, interviews }) => ({
				day,
				applications,
				interviews,
			})),
			applicationStatus: interviewStatusGroups.map((g) => ({
				stage: STATUS_LABEL[g.status] ?? g.status,
				value: g._count.status,
			})),
			departmentProgress,
			monthlyGrowth: {
				chartData: monthlyChartData,
				currentMonth: {
					total: currentMonthTotal,
					trend: calcTrend(currentMonthTotal, prevMonthTotal),
				},
			},
			recentActivities: activities,
		},
	});
}
