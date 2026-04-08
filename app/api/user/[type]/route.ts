import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";
import {
	sendWelcomeEmail,
	sendVerifyEmail,
	sendVerifyEmailAndWelcome,
} from "@/lib/email/mailer";

type Params = Promise<{ type: string }>;

// ─── Schemas ────────────────────────────────────────────────────────────────

const PlanNameValues = ["STARTER", "GROWTH", "PRO", "EXTRA", "CUSTOM"] as const;

const CreateCompanySchema = z.object({
	// Company info
	name: z.string().min(1, "Company name is required"),
	email: z.string().email("Valid email required"),
	// phone / location are accepted but not yet stored (no schema field on Agency/Account)
	phone: z.string().optional(),
	location: z.string().optional(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Must contain at least one uppercase letter")
		.regex(/[0-9]/, "Must contain at least one number"),
	// Subscription
	plan: z.enum(PlanNameValues).optional(),
	// Flags
	send_welcome_email: z.boolean().default(false),
	activate_immediately: z.boolean().default(false),
	verify_immediately: z.boolean().default(false),
});

const CreateCandidateSchema = z.object({
	f_name: z.string().min(1, "First name is required"),
	l_name: z.string().min(1, "Last name is required"),
	email: z.string().email("Valid email required"),
	phone: z.string().optional(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Must contain at least one uppercase letter")
		.regex(/[0-9]/, "Must contain at least one number"),
	// Flags
	send_welcome_email: z.boolean().default(false),
	activate_immediately: z.boolean().default(false),
	verify_immediately: z.boolean().default(false),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives a unique user_name from an email local-part.
 * Retries with a numeric suffix until no conflict is found.
 */
async function generateUserName(base: string): Promise<string> {
	const sanitized = base.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24);
	const existing = await prisma.account.findFirst({
		where: { user_name: sanitized },
	});
	if (!existing) return sanitized;
	const suffix = Math.floor(1000 + Math.random() * 9000);
	return `${sanitized}_${suffix}`;
}

function tokenExpiresAt() {
	const d = new Date();
	d.setHours(d.getHours() + 24);
	return d;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(
	request: NextRequest,
	{ params }: { params: Params }
) {
	const admin = await verifyAdminRequest(request);
	if (!admin) {
		return Response.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { type } = await params;

	if (type !== "company" && type !== "candidate") {
		return Response.json(
			{ message: "Invalid type. Use 'company' or 'candidate'" },
			{ status: 400 }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ message: "Invalid JSON" }, { status: 400 });
	}

	// ── Create Company ─────────────────────────────────────────────────────────
	if (type === "company") {
		const parsed = CreateCompanySchema.safeParse(body);
		if (!parsed.success) {
			return Response.json(
				{
					message: "Validation failed",
					errors: parsed.error.flatten().fieldErrors,
				},
				{ status: 422 }
			);
		}

		const {
			name,
			email,
			password,
			plan,
			send_welcome_email,
			activate_immediately,
			verify_immediately,
		} = parsed.data;

		const emailConflict = await prisma.account.findUnique({ where: { email } });
		if (emailConflict) {
			return Response.json(
				{ message: "An account with this email already exists" },
				{ status: 409 }
			);
		}

		if (plan) {
			const planExists = await prisma.subscriptionPlan.findUnique({
				where: { name: plan },
			});
			if (!planExists) {
				return Response.json(
					{
						message: `Subscription plan '${plan}' not found. Make sure plans are seeded.`,
					},
					{ status: 404 }
				);
			}
		}

		const password_hash = await bcrypt.hash(password, 12);
		const user_name = await generateUserName(email.split("@")[0]);

		const logId = await startAdminLog(request, admin.email, { action: "CREATE", tableName: "users", meta: { user_type: "company" } });
		// Create Agency → Credential → Account in a transaction
		try {
		const account = await prisma.$transaction(async (tx) => {
			const agency = await tx.agency.create({
				data: { company_name: name },
			});

			const credential = await tx.credential.create({
				data: { password_hash },
			});

			const newAccount = await tx.account.create({
				data: {
					email,
					f_name: name,
					l_name: "",
					user_name,
					verified: verify_immediately,
					agency_id: agency.id,
					credential_id: credential.id,
				},
				select: {
					id: true,
					email: true,
					f_name: true,
					verified: true,
					created_at: true,
					agency: { select: { id: true, company_name: true } },
				},
			});

			if (plan) {
				const planRecord = await tx.subscriptionPlan.findUnique({
					where: { name: plan },
				});
				if (planRecord) {
					await tx.agencySubscription.create({
						data: {
							agency_id: agency.id,
							plan_id: planRecord.id,
							is_active: activate_immediately,
						},
					});
				}
			}

			return newAccount;
		});

		if (send_welcome_email) {
			if (verify_immediately) {
				await sendWelcomeEmail(email, name);
			} else {
				const verifyToken = crypto.randomUUID();
				await prisma.verifyAccountToken.create({
					data: {
						token: verifyToken,
						expires_at: tokenExpiresAt(),
						account_id: account.id,
					},
				});
				const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${verifyToken}`;
				await sendVerifyEmail(email, name, verifyUrl);
			}
		}

		finalizeLog(logId, "SUCCESS", account.id);
		return Response.json({ data: account }, { status: 201 });
		} catch (err) {
			finalizeLog(logId, "FAILED", undefined, err instanceof Error ? err.message : "Unknown error");
			return Response.json({ message: "Internal server error" }, { status: 500 });
		}
	}

	// ── Create Candidate ───────────────────────────────────────────────────────
	const parsed = CreateCandidateSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(
			{
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			},
			{ status: 422 }
		);
	}

	const {
		f_name,
		l_name,
		email,
		phone,
		password,
		send_welcome_email,
		activate_immediately,
		verify_immediately,
	} = parsed.data;

	const emailConflict = await prisma.candidate.findUnique({ where: { email } });
	if (emailConflict) {
		return Response.json(
			{ message: "A candidate with this email already exists" },
			{ status: 409 }
		);
	}

	if (phone) {
		const phoneConflict = await prisma.candidate.findUnique({
			where: { phone },
		});
		if (phoneConflict) {
			return Response.json(
				{ message: "A candidate with this phone already exists" },
				{ status: 409 }
			);
		}
	}

	const password_hash = await bcrypt.hash(password, 12);

	const candidateLogId = await startAdminLog(request, admin.email, { action: "CREATE", tableName: "users", meta: { user_type: "candidate" } });
	try {
		const candidate = await prisma.$transaction(async (tx) => {
			const credential = await tx.candidateCredential.create({
				data: { password_hash },
			});

			return tx.candidate.create({
				data: {
					f_name,
					l_name,
					candidate_name: `${f_name} ${l_name}`,
					email,
					phone: phone ?? null,
					verified: verify_immediately,
					invited: activate_immediately,
					credential_id: credential.id,
				},
				select: {
					id: true,
					email: true,
					f_name: true,
					l_name: true,
					candidate_name: true,
					phone: true,
					verified: true,
					invited: true,
					created_at: true,
				},
			});
		});

		const fullName = `${f_name} ${l_name}`;
		if (send_welcome_email) {
			if (verify_immediately) {
				await sendWelcomeEmail(email ?? "", fullName);
			} else {
				const verifyToken = crypto.randomUUID();
				await prisma.candidateVerifyToken.create({
					data: { token: verifyToken, expires_at: tokenExpiresAt(), candidate_id: candidate.id },
				});
				const verifyUrl = `${process.env.FRONTEND_URL_CANDIDATE}/auth/verify?token=${verifyToken}`;
				await sendVerifyEmailAndWelcome(email ?? "", fullName, verifyUrl);
			}
		} else {
			const verifyToken = crypto.randomUUID();
			await prisma.candidateVerifyToken.create({
				data: { token: verifyToken, expires_at: tokenExpiresAt(), candidate_id: candidate.id },
			});
			const verifyUrl = `${process.env.FRONTEND_URL_CANDIDATE}/auth/verify?token=${verifyToken}`;
			await sendVerifyEmail(email ?? "", fullName, verifyUrl);
		}

		finalizeLog(candidateLogId, "SUCCESS", candidate.id);
		return Response.json({ data: candidate }, { status: 201 });
	} catch (err) {
		finalizeLog(candidateLogId, "FAILED", undefined, err instanceof Error ? err.message : "Unknown error");
		return Response.json({ message: "Internal server error" }, { status: 500 });
	}
}
