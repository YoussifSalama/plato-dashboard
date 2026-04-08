import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatJob(job: any) {
	return {
		id: job.id,
		title: job.title,
		workplace_type: job.workplace_type,
		employment_type: job.employment_type,
		seniority_level: job.seniority_level,
		industry: job.industry,
		location: job.location,
		is_active: job.is_active,
		effective_is_active: job.is_active,
		inactive_reason: null as null,
		created_at:
			job.created_at instanceof Date
				? job.created_at.toISOString()
				: job.created_at,
		agency_id: job.agency_id,
		company_name: job.agency?.company_name ?? null,
		account_id: job.agency?.account?.id ?? null,
		applicants_count: job._count?.resumes ?? 0,
	};
}

// ─── GET /api/jobs ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
	const limit = Math.min(
		100,
		Math.max(1, parseInt(searchParams.get("limit") ?? "10"))
	);
	const search = searchParams.get("search")?.trim() ?? "";
	const industry = searchParams.get("industry")?.trim() ?? "";
	const employment_type = searchParams.get("employment_type")?.trim() ?? "";
	const sort_by = searchParams.get("sort_by") ?? "created_at";
	const sort_order = (searchParams.get("sort_order") ?? "desc") as
		| "asc"
		| "desc";
	const agency_id_param = searchParams.get("agency_id");
	const agency_id = agency_id_param ? parseInt(agency_id_param) : null;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const where: any = {};
	if (search) where.title = { contains: search, mode: "insensitive" };
	if (industry) where.industry = industry;
	if (employment_type) where.employment_type = employment_type;
	if (agency_id && !isNaN(agency_id)) where.agency_id = agency_id;

	const validSortFields = ["created_at", "title", "is_active", "updated_at"];
	const safeSort = validSortFields.includes(sort_by) ? sort_by : "created_at";

	const [jobs, total] = await Promise.all([
		prisma.job.findMany({
			where,
			orderBy: { [safeSort]: sort_order },
			skip: (page - 1) * limit,
			take: limit,
			include: {
				agency: {
					select: {
						company_name: true,
						account: { select: { id: true } },
					},
				},
				_count: { select: { resumes: true } },
			},
		}),
		prisma.job.count({ where }),
	]);

	const total_pages = Math.max(1, Math.ceil(total / limit));

	return NextResponse.json({
		data: jobs.map(formatJob),
		meta: {
			total,
			page,
			limit,
			total_pages,
			current_page: page,
			next_page: page < total_pages ? page + 1 : null,
			previous_page: page > 1 ? page - 1 : null,
			has_next_page: page < total_pages,
			has_previous_page: page > 1,
			is_first_page: page === 1,
			is_last_page: page >= total_pages,
		},
	});
}

// ─── POST /api/jobs ────────────────────────────────────────────────────────────

const CreateJobSchema = z.object({
	agency_id: z.number().int().positive(),
	title: z.string().min(1),
	workplace_type: z.string().min(1),
	employment_type: z.string().min(1),
	seniority_level: z.string().min(1),
	industry: z.string().min(1),
	location: z.string().min(1),
	auto_deactivate_at: z.string().min(1),
	salary_currency: z.string().min(1),
	salary_from: z.number().min(0),
	salary_to: z.number().min(0),
	is_salary_negotiable: z.boolean().optional(),
	description: z.string().min(1),
	requirements: z.string().min(1),
	certifications: z.string().optional(),
	required_documents: z.string().optional(),
	company_overview: z.string().optional(),
	role_overview: z.string().optional(),
	responsibilities: z.string().optional(),
	nice_to_have: z.string().optional(),
	what_we_offer: z.string().optional(),
	job_benefits: z.string().optional(),
	auto_score_matching_threshold: z.number().int().min(0).optional(),
	auto_email_invite_threshold: z.number().int().min(0).optional(),
	auto_shortlisted_threshold: z.number().int().min(0).optional(),
	auto_denied_threshold: z.number().int().min(0).optional(),
	soft_skills: z.array(z.string()).optional(),
	technical_skills: z.array(z.string()).optional(),
	languages: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
	}

	const parsed = CreateJobSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			},
			{ status: 422 }
		);
	}

	const {
		agency_id,
		auto_deactivate_at,
		salary_currency,
		salary_from,
		salary_to,
		languages,
		soft_skills,
		technical_skills,
		certifications,
		...rest
	} = parsed.data;

	const agency = await prisma.agency.findUnique({ where: { id: agency_id } });
	if (!agency) {
		return NextResponse.json({ message: "Company not found" }, { status: 404 });
	}

	const logId = await startAdminLog(request, payload.email, { action: "CREATE", tableName: "jobs" });
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const job = await prisma.job.create({
			data: {
				...rest,
				agency_id,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				workplace_type: rest.workplace_type as any,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				employment_type: rest.employment_type as any,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				seniority_level: rest.seniority_level as any,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				industry: rest.industry as any,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				salary_currency: salary_currency as any,
				salary_from,
				salary_to,
				auto_deactivate_at: new Date(auto_deactivate_at),
				certifications: certifications ?? "",
				soft_skills: soft_skills ?? [],
				technical_skills: technical_skills ?? [],
				languages: ((languages as unknown) ?? []) as object[],
			},
			include: {
				agency: { select: { company_name: true } },
				_count: { select: { resumes: true } },
			},
		});
		finalizeLog(logId, "SUCCESS", job.id);
		return NextResponse.json({ data: formatJob(job) }, { status: 201 });
	} catch (err) {
		finalizeLog(logId, "FAILED", undefined, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
