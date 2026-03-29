import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

// Map DB status to UI-friendly label
function mapStatus(status: string): string {
	switch (status) {
		case "inactive":
			return "scheduled";
		case "active":
			return "in-screen";
		case "completed":
			return "completed";
		case "cancelled":
			return "cancelled";
		case "postponed":
			return "postponed";
		default:
			return status;
	}
}

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const summary = searchParams.get("summary");

	if (summary === "1" || summary === "true") {
		return getSummary();
	}

	return getList();
}

async function getList() {
	const sessions = await prisma.interviewSession.findMany({
		orderBy: { created_at: "desc" },
		include: {
			invitation_token: {
				include: {
					candidate: {
						select: { f_name: true, l_name: true },
					},
					job_application: {
						include: {
							job: { select: { title: true } },
						},
					},
				},
			},
			feedbacks: {
				select: { from: true, decision: true, rating: true },
			},
		},
	});

	const interviews = sessions.map((s) => {
		const candidate = s.invitation_token.candidate;
		const job = s.invitation_token.job_application?.job;

		// Duration in minutes — only meaningful when session is completed
		let duration_minutes: number | null = null;
		if (s.status === "completed") {
			const diff = s.completed_at.getTime() - s.created_at.getTime();
			if (diff > 0) duration_minutes = Math.round(diff / 60_000);
		}

		// Agency feedback decision (primary feedback for hiring outcome)
		const agencyFeedback = s.feedbacks.find((f) => f.from === "agency");
		const candidateFeedback = s.feedbacks.find((f) => f.from === "candidate");

		return {
			id: s.id,
			candidate_name: candidate
				? `${candidate.f_name} ${candidate.l_name}`.trim()
				: null,
			role: job?.title ?? null,
			scheduled_at: s.invitation_token.expires_at,
			completed_at: s.completed_at,
			duration_minutes,
			video_link: s.record ?? null,
			status: mapStatus(s.status),
			feedback: {
				agency: agencyFeedback
					? { decision: agencyFeedback.decision, rating: agencyFeedback.rating }
					: null,
				candidate: candidateFeedback
					? { decision: candidateFeedback.decision, rating: candidateFeedback.rating }
					: null,
			},
			created_at: s.created_at,
		};
	});

	return NextResponse.json({ data: { interviews, total: interviews.length } });
}

async function getSummary() {
	const now = new Date();

	const todayStart = new Date(now);
	todayStart.setHours(0, 0, 0, 0);
	const todayEnd = new Date(now);
	todayEnd.setHours(23, 59, 59, 999);

	// Start of current week (Monday)
	const weekStart = new Date(now);
	const day = weekStart.getDay();
	const diffToMonday = day === 0 ? -6 : 1 - day;
	weekStart.setDate(weekStart.getDate() + diffToMonday);
	weekStart.setHours(0, 0, 0, 0);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 6);
	weekEnd.setHours(23, 59, 59, 999);

	const [notScheduled, today, thisWeek, completed] = await Promise.all([
		// Not scheduled: sessions with status inactive (haven't started yet)
		prisma.interviewSession.count({
			where: { status: "inactive" },
		}),
		// Today: sessions whose scheduled date (token expires_at) falls today
		prisma.interviewSession.count({
			where: {
				invitation_token: {
					expires_at: { gte: todayStart, lte: todayEnd },
				},
			},
		}),
		// This week: sessions whose scheduled date falls this week
		prisma.interviewSession.count({
			where: {
				invitation_token: {
					expires_at: { gte: weekStart, lte: weekEnd },
				},
			},
		}),
		// Completed
		prisma.interviewSession.count({
			where: { status: "completed" },
		}),
	]);

	return NextResponse.json({
		data: {
			not_scheduled: notScheduled,
			today,
			this_week: thisWeek,
			completed,
		},
	});
}
