import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const subs = await prisma.agencySubscription.findMany({
		where: { is_active: true },
		select: {
			used_job_posting: true,
			used_resume_analysis: true,
			used_phone_calls: true,
			used_recordings: true,
			quota_job_posts_override: true,
			quota_resume_analysis_override: true,
			quota_phone_calls_override: true,
			quota_recordings_override: true,
			plan: {
				select: {
					job_posting_quota: true,
					resume_analysis_quota: true,
					phone_calls_quota: true,
					recordings_quota: true,
				},
			},
		},
	});

	let usedJobs = 0, totalJobs = 0;
	let usedCandidates = 0, totalCandidates = 0;
	let usedMessages = 0, totalMessages = 0;
	let usedDownloads = 0, totalDownloads = 0;

	for (const sub of subs) {
		usedJobs += sub.used_job_posting;
		usedCandidates += sub.used_resume_analysis;
		usedMessages += sub.used_phone_calls;
		usedDownloads += sub.used_recordings;

		// Effective limit: override ?? plan quota (0 means unlimited → skip from total)
		const jobLimit = sub.quota_job_posts_override ?? sub.plan.job_posting_quota;
		const candidateLimit = sub.quota_resume_analysis_override ?? sub.plan.resume_analysis_quota;
		const messageLimit = sub.quota_phone_calls_override ?? sub.plan.phone_calls_quota;
		const downloadLimit = sub.quota_recordings_override ?? sub.plan.recordings_quota;

		if (jobLimit > 0) totalJobs += jobLimit;
		if (candidateLimit > 0) totalCandidates += candidateLimit;
		if (messageLimit > 0) totalMessages += messageLimit;
		if (downloadLimit > 0) totalDownloads += downloadLimit;
	}

	const safePct = (used: number, total: number) =>
		total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

	return NextResponse.json({
		data: {
			job_posts: {
				used: usedJobs,
				total: totalJobs,
				pct: safePct(usedJobs, totalJobs),
			},
			candidates: {
				used: usedCandidates,
				total: totalCandidates,
				pct: safePct(usedCandidates, totalCandidates),
			},
			messages: {
				used: usedMessages,
				total: totalMessages,
				pct: safePct(usedMessages, totalMessages),
			},
			downloads: {
				used: usedDownloads,
				total: totalDownloads,
				pct: safePct(usedDownloads, totalDownloads),
			},
		},
	});
}
