import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStatus(voucher: {
	is_active: boolean;
	expires_at: Date | null;
}): "Active" | "Inactive" | "Expired" {
	const now = new Date();
	if (voucher.expires_at && voucher.expires_at <= now) return "Expired";
	if (!voucher.is_active) return "Inactive";
	return "Active";
}

function formatVoucher(v: {
	id: number;
	code: string;
	discount: number;
	type: string;
	usage_count: number;
	usage_limit: number | null;
	expires_at: Date | null;
	is_active: boolean;
	features: string[];
	plans: string[];
	color: string;
	revenue_impact: number;
	created_at: Date;
}) {
	return {
		id: v.id,
		code: v.code,
		discount: v.discount,
		type: v.type === "PERCENTAGE" ? "%" : "$",
		usage: { used: v.usage_count, limit: v.usage_limit },
		expires: v.expires_at?.toISOString() ?? null,
		status: computeStatus(v),
		features: v.features,
		plans: v.plans,
		color: v.color,
		revenue_impact: v.revenue_impact,
		created_at: v.created_at.toISOString(),
	};
}

// ─── Validation ───────────────────────────────────────────────────────────────

const UpdateVoucherSchema = z.object({
	code: z
		.string()
		.min(1)
		.max(50)
		.transform((s) => s.toUpperCase().trim())
		.optional(),
	discount: z.number().positive().optional(),
	type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
	usage_limit: z.number().int().positive().nullable().optional(),
	expires_at: z.string().datetime().nullable().optional(),
	is_active: z.boolean().optional(),
	plans: z.array(z.string()).optional(),
	features: z.array(z.string()).optional(),
	color: z.string().optional(),
	revenue_impact: z.number().min(0).optional(),
});

// ─── PUT — edit voucher ───────────────────────────────────────────────────────

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
		return NextResponse.json({ message: "Invalid voucher ID" }, { status: 400 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
	}

	const parsed = UpdateVoucherSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	const existing = await prisma.voucher.findUnique({ where: { id } });
	if (!existing) {
		return NextResponse.json({ message: "Voucher not found" }, { status: 404 });
	}

	// If code is changing, check for conflicts
	if (parsed.data.code && parsed.data.code !== existing.code) {
		const conflict = await prisma.voucher.findUnique({
			where: { code: parsed.data.code },
		});
		if (conflict) {
			return NextResponse.json(
				{ message: "Voucher code already exists" },
				{ status: 409 }
			);
		}
	}

	const { expires_at, ...rest } = parsed.data;

	const updated = await prisma.voucher.update({
		where: { id },
		data: {
			...rest,
			...(expires_at !== undefined
				? { expires_at: expires_at ? new Date(expires_at) : null }
				: {}),
		},
	});

	return NextResponse.json({ data: { voucher: formatVoucher(updated) } });
}

// ─── PATCH — activate / deactivate voucher ────────────────────────────────────

export async function PATCH(
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
		return NextResponse.json({ message: "Invalid voucher ID" }, { status: 400 });
	}

	const existing = await prisma.voucher.findUnique({ where: { id } });
	if (!existing) {
		return NextResponse.json({ message: "Voucher not found" }, { status: 404 });
	}

	const updated = await prisma.voucher.update({
		where: { id },
		data: { is_active: !existing.is_active },
	});

	return NextResponse.json({ data: { voucher: formatVoucher(updated) } });
}
