import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const resumeId = Number(id);

	if (!Number.isInteger(resumeId) || resumeId <= 0) {
		return NextResponse.json({ message: "Invalid resume ID" }, { status: 400 });
	}

	const resume = await prisma.resume.findFirst({
		where: { id: resumeId },
		select: {
			id: true,
			name: true,
			link: true,
			created_at: true,
			auto_denied: true,
			auto_shortlisted: true,
			auto_invited: true,
			job: {
				select: { title: true },
			},
			resume_structured: {
				select: { data: true },
			},
			resume_analysis: {
				select: {
					score: true,
					job_type: true,
					score_breakdown: true,
					dealbreakers: true,
					seniority_level: true,
					seniority_fit: true,
					recommendation: true,
					confidence: true,
					risk_level: true,
					summary: true,
					profile_tagline: true,
					top_strength: true,
					top_concern: true,
					matched_technical_skills: true,
					missing_technical_skills: true,
					matched_soft_skills: true,
					missing_soft_skills: true,
					analysis_summary_paragraph: true,
					created_at: true,
					updated_at: true,
				},
			},
			application: {
				include: {
					documents: true,
					invitation_tokens: {
						select: {
							interview_session: {
								select: {
									feedbacks: { select: { from: true, decision: true } },
								},
							},
						},
					},
				},
			},
		},
	});

	if (!resume) {
		return NextResponse.json({ message: "Resume not found" }, { status: 404 });
	}

	// Derive application status from invitation tokens + analysis
	let application_status = "active";
	if (resume.application) {
		const tokens = resume.application.invitation_tokens ?? [];
		const hasOffer = tokens.some((t) =>
			t.interview_session?.feedbacks.some(
				(f) => f.from === "agency" && f.decision === "shortlist"
			)
		);
		const hasInterview = tokens.some((t) => t.interview_session !== null);
		if (hasOffer) application_status = "offer";
		else if (hasInterview) application_status = "in_interview";
		else if (tokens.length > 0) application_status = "shortlisted";
		else if (resume.resume_analysis?.recommendation === "not_recommended")
			application_status = "rejected";
		else if (resume.resume_analysis) application_status = "in_review";
	}

	return NextResponse.json({
		data: {
			...resume,
			link: resume.link ?? null,
			application_status,
			application_created_at: resume.application?.created_at ?? null,
		},
		message: "Resume details fetched successfully",
	});
}
