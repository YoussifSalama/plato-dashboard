import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

const ChangePasswordSchema = z.object({
	current_password: z.string().min(1, "Current password is required"),
	new_password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
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

	const parsed = ChangePasswordSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	const { current_password, new_password } = parsed.data;

	// Load admin with credential
	const admin = await prisma.admin.findUnique({
		where: { id: payload.adminId },
		include: { credential: true },
	});

	if (!admin || !admin.credential) {
		return NextResponse.json({ message: "Admin not found" }, { status: 404 });
	}

	// Verify current password
	const isCorrect = await bcrypt.compare(current_password, admin.credential.password_hash);
	if (!isCorrect) {
		return NextResponse.json(
			{ message: "Current password is incorrect" },
			{ status: 400 }
		);
	}

	// Hash new password and update
	const password_hash = await bcrypt.hash(new_password, 12);
	const logId = await startAdminLog(request, payload.email, { action: "UPDATE", tableName: "admins", meta: { field: "password" } });
	try {
		await prisma.adminCredential.update({
			where: { id: admin.credential.id },
			data: { password_hash },
		});
		finalizeLog(logId, "SUCCESS", payload.adminId);
		return NextResponse.json({ data: { message: "Password updated successfully" } });
	} catch (err) {
		finalizeLog(logId, "FAILED", payload.adminId, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
