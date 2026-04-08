import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

const LimitsSchema = z.object({
	jobPosts: z.number().int().positive().nullable(),
	candidates: z.number().int().positive().nullable(),
	messages: z.number().int().positive().nullable(),
	downloads: z.number().int().positive().nullable(),
	resetUsage: z.boolean().optional(),
});

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ agencyId: string }> }
) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { agencyId: rawId } = await params;
	const agencyId = parseInt(rawId);
	if (isNaN(agencyId)) {
		return NextResponse.json({ message: "Invalid agency ID" }, { status: 400 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
	}

	const parsed = LimitsSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	const { jobPosts, candidates, messages, downloads, resetUsage } = parsed.data;

	const sub = await prisma.agencySubscription.findUnique({
		where: { agency_id: agencyId },
	});
	if (!sub) {
		return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
	}

	const logId = await startAdminLog(request, payload.email, { action: "UPDATE", tableName: "quotas" });
	try {
		const updated = await prisma.agencySubscription.update({
			where: { agency_id: agencyId },
			data: {
				quota_job_posts_override: jobPosts,
				quota_resume_analysis_override: candidates,
				quota_phone_calls_override: messages,
				quota_recordings_override: downloads,
				...(resetUsage
					? {
							used_job_posting: 0,
							used_resume_analysis: 0,
							used_phone_calls: 0,
							used_recordings: 0,
						}
					: {}),
			},
			include: {
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

		const effectiveLimit = (override: number | null, planQuota: number) =>
			override !== null ? override : planQuota > 0 ? planQuota : null;

		finalizeLog(logId, "SUCCESS", agencyId);
		return NextResponse.json({
			data: {
				limits: {
					jobPosts: effectiveLimit(updated.quota_job_posts_override, updated.plan.job_posting_quota),
					candidates: effectiveLimit(updated.quota_resume_analysis_override, updated.plan.resume_analysis_quota),
					messages: effectiveLimit(updated.quota_phone_calls_override, updated.plan.phone_calls_quota),
					downloads: effectiveLimit(updated.quota_recordings_override, updated.plan.recordings_quota),
				},
				usage: {
					jobPosts: updated.used_job_posting,
					candidates: updated.used_resume_analysis,
					messages: updated.used_phone_calls,
					downloads: updated.used_recordings,
				},
			},
		});
	} catch (err) {
		finalizeLog(logId, "FAILED", agencyId, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
