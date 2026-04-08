import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

const CreditsSchema = z.object({
	credit_type: z.enum(["jobPosts", "candidates", "messages", "downloads"]),
	amount: z.number().int().positive(),
});

export async function POST(
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

	const parsed = CreditsSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	const { credit_type, amount } = parsed.data;

	const sub = await prisma.agencySubscription.findUnique({
		where: { agency_id: agencyId },
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
	if (!sub) {
		return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
	}

	// Determine current effective limit for the credit type, then add amount
	const fieldMap = {
		jobPosts: {
			overrideField: "quota_job_posts_override" as const,
			currentOverride: sub.quota_job_posts_override,
			planQuota: sub.plan.job_posting_quota,
		},
		candidates: {
			overrideField: "quota_resume_analysis_override" as const,
			currentOverride: sub.quota_resume_analysis_override,
			planQuota: sub.plan.resume_analysis_quota,
		},
		messages: {
			overrideField: "quota_phone_calls_override" as const,
			currentOverride: sub.quota_phone_calls_override,
			planQuota: sub.plan.phone_calls_quota,
		},
		downloads: {
			overrideField: "quota_recordings_override" as const,
			currentOverride: sub.quota_recordings_override,
			planQuota: sub.plan.recordings_quota,
		},
	};

	const { overrideField, currentOverride, planQuota } = fieldMap[credit_type];
	// Current effective limit: override ?? plan quota. 0 plan = unlimited → treat as 0 base.
	const currentLimit = currentOverride ?? planQuota;
	const newLimit = currentLimit + amount;

	const logId = await startAdminLog(request, payload.email, { action: "CREATE", tableName: "quotas", meta: { credit_type, amount, new_limit: newLimit } });
	try {
		const updated = await prisma.agencySubscription.update({
			where: { agency_id: agencyId },
			data: { [overrideField]: newLimit },
			select: {
				quota_job_posts_override: true,
				quota_resume_analysis_override: true,
				quota_phone_calls_override: true,
				quota_recordings_override: true,
			},
		});
		finalizeLog(logId, "SUCCESS", agencyId);
		return NextResponse.json({
			data: {
				credit_type,
				new_limit: newLimit,
				overrides: updated,
			},
		});
	} catch (err) {
		finalizeLog(logId, "FAILED", agencyId, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
