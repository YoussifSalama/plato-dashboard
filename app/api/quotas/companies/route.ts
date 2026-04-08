import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

function effectiveLimit(override: number | null, planQuota: number): number | null {
	if (override !== null) return override;
	return planQuota > 0 ? planQuota : null; // 0 in plan = unlimited
}

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const search = searchParams.get("search")?.trim() ?? "";
	const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
	const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const agencyWhere: any = {};
	if (search) {
		agencyWhere.OR = [
			{ company_name: { contains: search, mode: "insensitive" } },
			{ account: { f_name: { contains: search, mode: "insensitive" } } },
			{ account: { l_name: { contains: search, mode: "insensitive" } } },
		];
	}

	const [subs, total] = await Promise.all([
		prisma.agencySubscription.findMany({
			where: {
				is_active: true,
				agency: agencyWhere,
			},
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { created_at: "desc" },
			select: {
				agency_id: true,
				used_job_posting: true,
				used_resume_analysis: true,
				used_phone_calls: true,
				used_recordings: true,
				quota_job_posts_override: true,
				quota_resume_analysis_override: true,
				quota_phone_calls_override: true,
				quota_recordings_override: true,
				agency: {
					select: {
						company_name: true,
						account: { select: { f_name: true, l_name: true } },
					},
				},
				plan: {
					select: {
						name: true,
						display_name: true,
						job_posting_quota: true,
						resume_analysis_quota: true,
						phone_calls_quota: true,
						recordings_quota: true,
					},
				},
			},
		}),
		prisma.agencySubscription.count({
			where: { is_active: true, agency: agencyWhere },
		}),
	]);

	const companies = subs.map((sub) => ({
		id: sub.agency_id,
		name:
			(sub.agency.company_name ??
			`${sub.agency.account?.f_name ?? ""} ${sub.agency.account?.l_name ?? ""}`.trim()) ||
			"Unknown",
		plan: sub.plan.display_name ?? sub.plan.name,
		usage: {
			jobPosts: sub.used_job_posting,
			candidates: sub.used_resume_analysis,
			messages: sub.used_phone_calls,
			downloads: sub.used_recordings,
		},
		limits: {
			jobPosts: effectiveLimit(sub.quota_job_posts_override, sub.plan.job_posting_quota),
			candidates: effectiveLimit(sub.quota_resume_analysis_override, sub.plan.resume_analysis_quota),
			messages: effectiveLimit(sub.quota_phone_calls_override, sub.plan.phone_calls_quota),
			downloads: effectiveLimit(sub.quota_recordings_override, sub.plan.recordings_quota),
		},
	}));

	return NextResponse.json({ data: { companies, total, page, limit } });
}
