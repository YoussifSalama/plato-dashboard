import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

const UpdatePlanSchema = z.object({
	display_name: z.string().min(1).max(100).optional(),
	price: z.number().min(0).optional(),
	billing_period: z.enum(["month", "year"]).optional(),
	features: z.array(z.string()).optional(),
	color: z.string().optional(),
	is_public: z.boolean().optional(),
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
		return NextResponse.json({ message: "Invalid plan ID" }, { status: 400 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
	}

	const parsed = UpdatePlanSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
	if (!existing) {
		return NextResponse.json({ message: "Plan not found" }, { status: 404 });
	}

	const logId = await startAdminLog(request, payload.email, { action: "UPDATE", tableName: "subscription_plans" });
	try {
		const updated = await prisma.subscriptionPlan.update({
			where: { id },
			data: parsed.data,
			include: {
				_count: {
					select: {
						agency_subscriptions: { where: { is_active: true } },
					},
				},
			},
		});
		finalizeLog(logId, "SUCCESS", id);
		return NextResponse.json({
			data: {
				plan: {
					id: updated.id,
					name: updated.name,
					display_name: updated.display_name ?? updated.name,
					price: updated.price,
					billing_period: updated.billing_period,
					features: updated.features,
					color: updated.color,
					is_public: updated.is_public,
					active_users: updated._count.agency_subscriptions,
				},
			},
		});
	} catch (err) {
		finalizeLog(logId, "FAILED", id, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
