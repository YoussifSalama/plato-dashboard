import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
	const diffMs = Date.now() - date.getTime();
	const diffDays = Math.floor(diffMs / 86_400_000);
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "1 day ago";
	if (diffDays < 30) return `${diffDays} days ago`;
	const months = Math.floor(diffDays / 30);
	if (months === 1) return "1 month ago";
	if (months < 12) return `${months} months ago`;
	const years = Math.floor(months / 12);
	return years === 1 ? "1 year ago" : `${years} years ago`;
}

type ApplicationWithRelations = Awaited<
	ReturnType<typeof fetchApplications>
>[number];

function deriveStatus(
	app: ApplicationWithRelations
):
	| "active"
	| "in_review"
	| "shortlisted"
	| "in_interview"
	| "offer"
	| "rejected" {
	// Offer: interview session with agency shortlist decision
	const hasOffer = app.invitation_tokens.some((t) =>
		t.interview_session?.feedbacks.some(
			(f) => f.from === "agency" && f.decision === "shortlist"
		)
	);
	if (hasOffer) return "offer";

	// In interview: has an interview session
	const hasInterview = app.invitation_tokens.some(
		(t) => t.interview_session !== null
	);
	if (hasInterview) return "in_interview";

	// Shortlisted: has an invitation token (was invited)
	if (app.invitation_tokens.length > 0) return "shortlisted";

	// Rejected via resume analysis
	if (app.resume.resume_analysis?.recommendation === "not_recommended")
		return "rejected";

	// Has analysis but not rejected
	if (app.resume.resume_analysis) return "in_review";

	return "active";
}

function normalizeScore(score: number | null | undefined): number | null {
	if (score == null) return null;
	// Score is 0–100; convert to 0–5 with one decimal
	return Math.round((score / 100) * 5 * 10) / 10;
}

// ─── Shared query ─────────────────────────────────────────────────────────────

async function fetchApplications() {
	return prisma.jobApplication.findMany({
		orderBy: { created_at: "desc" },
		include: {
			candidate: {
				select: {
					id: true,
					f_name: true,
					l_name: true,
					email: true,
					phone: true,
					profile: {
						select: {
							id: true,
							headline: true,
							location: true,
						},
					},
				},
			},
			resume: {
				select: {
					resume_structured: {
						select: {
							current_title: true,
							city: true,
							phone: true,
							email: true,
						},
					},
					resume_analysis: {
						select: {
							score: true,
							recommendation: true,
						},
					},
					id: true,
				},
			},
			invitation_tokens: {
				select: {
					interview_session: {
						select: {
							feedbacks: {
								select: { from: true, decision: true },
							},
						},
					},
				},
			},
		},
	});
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;

	if (
		searchParams.get("summary") === "1" ||
		searchParams.get("summary") === "true"
	) {
		return getSummary();
	}

	return getList();
}

function formatDiff(current: number, prev: number): string {
	const diff = current - prev;
	if (diff === 0) return "+0";
	return diff > 0 ? `+${diff}` : `${diff}`;
}

function formatPctDiff(current: number, prev: number): string {
	if (prev === 0) return current > 0 ? "+100%" : "+0%";
	const pct = ((current - prev) / prev) * 100;
	const rounded = Math.round(pct * 10) / 10;
	if (rounded === 0) return "+0%";
	return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

async function getSummary() {
	const now = new Date();

	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);

	const inReviewWhere = {
		resume: { resume_analysis: { isNot: null } },
	} as const;
	const interviewedWhere = {
		invitation_tokens: { some: { interview_session: { isNot: null } } },
	} as const;
	const offerWhere = {
		invitation_tokens: {
			some: {
				interview_session: {
					feedbacks: { some: { from: "agency", decision: "shortlist" } },
				},
			},
		},
	} as const;

	const [
		total,
		inReview,
		interviewed,
		gotOffer,
		totalLastMonth,
		inReviewLastMonth,
		interviewedLastMonth,
		gotOfferLastMonth,
	] = await Promise.all([
		prisma.jobApplication.count(),
		prisma.jobApplication.count({ where: inReviewWhere }),
		prisma.jobApplication.count({ where: interviewedWhere }),
		prisma.jobApplication.count({ where: offerWhere }),

		prisma.jobApplication.count({
			where: { created_at: { gte: lastMonthStart, lte: lastMonthEnd } },
		}),
		prisma.jobApplication.count({
			where: {
				...inReviewWhere,
				created_at: { gte: lastMonthStart, lte: lastMonthEnd },
			},
		}),
		prisma.jobApplication.count({
			where: {
				...interviewedWhere,
				created_at: { gte: lastMonthStart, lte: lastMonthEnd },
			},
		}),
		prisma.jobApplication.count({
			where: {
				...offerWhere,
				created_at: { gte: lastMonthStart, lte: lastMonthEnd },
			},
		}),
	]);

	const thisMonthTotal = await prisma.jobApplication.count({
		where: { created_at: { gte: thisMonthStart } },
	});

	return NextResponse.json({
		data: {
			total,
			in_review: inReview,
			interviewed,
			got_offer: gotOffer,
			diff: {
				total: formatPctDiff(thisMonthTotal, totalLastMonth),
				in_review: formatDiff(inReview, inReviewLastMonth),
				interviewed: formatDiff(interviewed, interviewedLastMonth),
				got_offer: formatDiff(gotOffer, gotOfferLastMonth),
			},
		},
	});
}

async function getList() {
	const applications = await fetchApplications();

	const records = applications.map((app) => {
		const c = app.candidate;
		const structured = app.resume.resume_structured;

		return {
			application_id: app.id,
			candidate_id: c.id,
			profile_id: c.profile?.id ?? null,
			candidate_name: `${c.f_name} ${c.l_name}`.trim(),
			candidate_email: c.email ?? structured?.email ?? null,
			candidate_phone: c.phone ?? structured?.phone ?? null,
			candidate_title: c.profile?.headline ?? structured?.current_title ?? null,
			candidate_location: c.profile?.location ?? structured?.city ?? null,
			applied_ago: timeAgo(app.created_at),
			score_out_of_5: normalizeScore(app.resume.resume_analysis?.score),
			status: deriveStatus(app),
			resumeId: app.resume.id,
		};
	});

	return NextResponse.json({
		data: { applications: records, total: records.length },
	});
}
