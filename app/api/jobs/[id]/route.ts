/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatJobDetail(job: any) {
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
		auto_deactivate_at:
			job.auto_deactivate_at instanceof Date
				? job.auto_deactivate_at.toISOString()
				: job.auto_deactivate_at,
		agency_id: job.agency_id,
		company_name: job.agency?.company_name ?? null,
		account_id: job.agency?.account?.id ?? null,
		applicants_count: job._count?.resumes ?? 0,
		// Salary
		salary_currency: job.salary_currency,
		salary_from: Number(job.salary_from),
		salary_to: Number(job.salary_to),
		is_salary_negotiable: job.is_salary_negotiable,
		// Content
		description: job.description,
		requirements: job.requirements,
		certifications: job.certifications,
		required_documents: job.required_documents,
		company_overview: job.company_overview,
		role_overview: job.role_overview,
		responsibilities: job.responsibilities,
		nice_to_have: job.nice_to_have,
		what_we_offer: job.what_we_offer,
		job_benefits: job.job_benefits,
		// Thresholds
		auto_score_matching_threshold: job.auto_score_matching_threshold,
		auto_email_invite_threshold: job.auto_email_invite_threshold,
		auto_shortlisted_threshold: job.auto_shortlisted_threshold,
		auto_denied_threshold: job.auto_denied_threshold,
		// Skills
		soft_skills: job.soft_skills ?? [],
		technical_skills: job.technical_skills ?? [],
		languages: job.languages ?? [],
		// AI Prompt
		jobAiPrompt: job.jobAiPrompt ?? null,
	};
}

// ─── GET /api/jobs/[id] ────────────────────────────────────────────────────────

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { id: rawId } = await params;
	const id = parseInt(rawId);
	if (isNaN(id)) {
		return NextResponse.json({ message: "Invalid job ID" }, { status: 400 });
	}

	const job = await prisma.job.findUnique({
		where: { id },
		include: {
			agency: {
				select: { company_name: true, account: { select: { id: true } } },
			},
			_count: { select: { resumes: true } },
			jobAiPrompt: true,
		},
	});

	if (!job) {
		return NextResponse.json({ message: "Job not found" }, { status: 404 });
	}

	return NextResponse.json({ data: formatJobDetail(job) });
}

// ─── PUT /api/jobs/[id] ────────────────────────────────────────────────────────

const UpdateJobSchema = z.object({
	title: z.string().min(1).optional(),
	workplace_type: z.string().min(1).optional(),
	employment_type: z.string().min(1).optional(),
	seniority_level: z.string().min(1).optional(),
	industry: z.string().min(1).optional(),
	location: z.string().min(1).optional(),
	auto_deactivate_at: z.string().min(1).optional(),
	salary_currency: z.string().min(1).optional(),
	salary_from: z.number().min(0).optional(),
	salary_to: z.number().min(0).optional(),
	is_salary_negotiable: z.boolean().optional(),
	description: z.string().min(1).optional(),
	requirements: z.string().min(1).optional(),
	certifications: z.string().optional(),
	required_documents: z.string().optional(),
	company_overview: z.string().optional(),
	role_overview: z.string().optional(),
	responsibilities: z.string().optional(),
	nice_to_have: z.string().optional(),
	what_we_offer: z.string().optional(),
	job_benefits: z.string().optional(),
	auto_score_matching_threshold: z.number().int().min(0).nullable().optional(),
	auto_email_invite_threshold: z.number().int().min(0).nullable().optional(),
	auto_shortlisted_threshold: z.number().int().min(0).nullable().optional(),
	auto_denied_threshold: z.number().int().min(0).nullable().optional(),
	soft_skills: z.array(z.string()).optional(),
	technical_skills: z.array(z.string()).optional(),
	languages: z.array(z.string()).optional(),
});

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { id: rawId } = await params;
	const id = parseInt(rawId);
	if (isNaN(id)) {
		return NextResponse.json({ message: "Invalid job ID" }, { status: 400 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
	}

	const parsed = UpdateJobSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			},
			{ status: 422 }
		);
	}

	const existing = await prisma.job.findUnique({ where: { id } });
	if (!existing) {
		return NextResponse.json({ message: "Job not found" }, { status: 404 });
	}

	const { auto_deactivate_at, languages, ...rest } = parsed.data;

	const logId = await startAdminLog(request, payload.email, { action: "UPDATE", tableName: "jobs" });
	try {
		const job = await prisma.job.update({
			where: { id },
			data: {
				...rest,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(rest.workplace_type
					? { workplace_type: rest.workplace_type as any }
					: {}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(rest.employment_type
					? { employment_type: rest.employment_type as any }
					: {}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(rest.seniority_level
					? { seniority_level: rest.seniority_level as any }
					: {}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(rest.industry ? { industry: rest.industry as any } : {}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(rest.salary_currency
					? { salary_currency: rest.salary_currency as any }
					: {}),
				...(auto_deactivate_at
					? { auto_deactivate_at: new Date(auto_deactivate_at) }
					: {}),
				...(languages !== undefined
					? { languages: languages as unknown as object[] }
					: {}),
			},
			include: {
				agency: {
					select: { company_name: true, account: { select: { id: true } } },
				},
				_count: { select: { resumes: true } },
				jobAiPrompt: true,
			},
		});
		finalizeLog(logId, "SUCCESS", id);
		return NextResponse.json({ data: formatJobDetail(job) });
	} catch (err) {
		finalizeLog(logId, "FAILED", id, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}

// ─── DELETE /api/jobs/[id] ─────────────────────────────────────────────────────

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { id: rawId } = await params;
	const id = parseInt(rawId);
	if (isNaN(id)) {
		return NextResponse.json({ message: "Invalid job ID" }, { status: 400 });
	}

	const existing = await prisma.job.findUnique({ where: { id } });
	if (!existing) {
		return NextResponse.json({ message: "Job not found" }, { status: 404 });
	}

	const logId = await startAdminLog(request, payload.email, { action: "DELETE", tableName: "jobs" });
	try {
		await prisma.job.delete({ where: { id } });
		finalizeLog(logId, "SUCCESS", id);
		return NextResponse.json({ message: "Job deleted successfully" });
	} catch (err) {
		finalizeLog(logId, "FAILED", id, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
