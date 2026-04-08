import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

// Singleton settings: always id=1, upsert on save.

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const [settings, admin] = await Promise.all([
		prisma.platformSettings.upsert({
			where: { id: 1 },
			create: { id: 1 },
			update: {},
		}),
		prisma.admin.findUnique({
			where: { id: payload.adminId },
			select: {
				email: true,
				credential: { select: { updated_at: true } },
			},
		}),
	]);

	if (!admin) {
		return NextResponse.json({ message: "Admin not found" }, { status: 404 });
	}

	return NextResponse.json({
		data: {
			platform_name: settings.platform_name,
			support_email: settings.support_email,
			email_notifications: settings.email_notifications,
			new_user_alerts: settings.new_user_alerts,
			payment_alerts: settings.payment_alerts,
			admin_email: admin.email,
			password_last_changed_at: admin.credential?.updated_at ?? null,
		},
	});
}

const UpdateSettingsSchema = z.object({
	platform_name: z.string().min(1).max(100).optional(),
	support_email: z.string().email().optional(),
	email_notifications: z.boolean().optional(),
	new_user_alerts: z.boolean().optional(),
	payment_alerts: z.boolean().optional(),
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

	const parsed = UpdateSettingsSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	const logId = await startAdminLog(request, payload.email, { action: "UPDATE", tableName: "settings" });
	try {
		const settings = await prisma.platformSettings.upsert({
			where: { id: 1 },
			create: { id: 1, ...parsed.data },
			update: parsed.data,
		});
		finalizeLog(logId, "SUCCESS", 1);
		return NextResponse.json({
			data: {
				platform_name: settings.platform_name,
				support_email: settings.support_email,
				email_notifications: settings.email_notifications,
				new_user_alerts: settings.new_user_alerts,
				payment_alerts: settings.payment_alerts,
			},
		});
	} catch (err) {
		finalizeLog(logId, "FAILED", 1, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
