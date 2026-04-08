import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

const UpdateEmailSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export async function PUT(request: NextRequest) {
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

	const parsed = UpdateEmailSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	const { email } = parsed.data;

	// Check email isn't already taken by another admin
	const existing = await prisma.admin.findUnique({ where: { email } });
	if (existing && existing.id !== payload.adminId) {
		return NextResponse.json(
			{ message: "This email is already in use" },
			{ status: 409 }
		);
	}

	const logId = await startAdminLog(request, payload.email, { action: "UPDATE", tableName: "admins" });
	try {
		const admin = await prisma.admin.update({
			where: { id: payload.adminId },
			data: { email },
			select: { id: true, email: true },
		});
		finalizeLog(logId, "SUCCESS", admin.id);
		return NextResponse.json({ data: { admin } });
	} catch (err) {
		finalizeLog(logId, "FAILED", payload.adminId, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
