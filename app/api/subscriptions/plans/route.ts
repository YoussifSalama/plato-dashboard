import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const plans = await prisma.subscriptionPlan.findMany({
		orderBy: { price: "asc" },
		include: {
			_count: {
				select: {
					agency_subscriptions: { where: { is_active: true } },
				},
			},
		},
	});

	const formatted = plans.map((p) => ({
		id: p.id,
		name: p.name,
		display_name: p.display_name ?? p.name,
		price: p.price,
		billing_period: p.billing_period,
		features: p.features,
		color: p.color,
		is_public: p.is_public,
		active_users: p._count.agency_subscriptions,
	}));

	return NextResponse.json({ data: { plans: formatted } });
}
