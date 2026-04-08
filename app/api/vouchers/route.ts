import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";
import { startAdminLog, finalizeLog } from "@/lib/system-logger";

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

// ─── Summary ──────────────────────────────────────────────────────────────────

async function getSummary() {
	const now = new Date();
	const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

	const [activeCount, redemptionsAgg, revenueAgg, expiringSoon] =
		await Promise.all([
			prisma.voucher.count({
				where: {
					is_active: true,
					OR: [{ expires_at: null }, { expires_at: { gt: now } }],
				},
			}),
			prisma.voucher.aggregate({ _sum: { usage_count: true } }),
			prisma.voucher.aggregate({ _sum: { revenue_impact: true } }),
			prisma.voucher.count({
				where: {
					is_active: true,
					expires_at: { gte: now, lte: sevenDaysFromNow },
				},
			}),
		]);

	return NextResponse.json({
		data: {
			active_vouchers: activeCount,
			total_redemptions: redemptionsAgg._sum.usage_count ?? 0,
			revenue_impact: revenueAgg._sum.revenue_impact ?? 0,
			expiring_soon: expiringSoon,
		},
	});
}

// ─── List ─────────────────────────────────────────────────────────────────────

async function getList(searchParams: URLSearchParams) {
	const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
	const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
	const search = searchParams.get("search")?.trim() ?? "";
	const statusFilter = searchParams.get("status") ?? "";

	const now = new Date();

	// Build where clause
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const where: any = {};

	if (search) {
		where.code = { contains: search, mode: "insensitive" };
	}

	if (statusFilter === "Active") {
		where.is_active = true;
		where.OR = [{ expires_at: null }, { expires_at: { gt: now } }];
	} else if (statusFilter === "Inactive") {
		where.is_active = false;
		where.OR = [{ expires_at: null }, { expires_at: { gt: now } }];
	} else if (statusFilter === "Expired") {
		where.expires_at = { lte: now };
	}

	const [vouchers, total] = await Promise.all([
		prisma.voucher.findMany({
			where,
			orderBy: { created_at: "desc" },
			skip: (page - 1) * limit,
			take: limit,
		}),
		prisma.voucher.count({ where }),
	]);

	return NextResponse.json({
		data: {
			vouchers: vouchers.map(formatVoucher),
			total,
			page,
			limit,
		},
	});
}

// ─── Validation ───────────────────────────────────────────────────────────────

const CreateVoucherSchema = z.object({
	code: z
		.string()
		.min(1)
		.max(50)
		.transform((s) => s.toUpperCase().trim()),
	discount: z.number().positive(),
	type: z.enum(["PERCENTAGE", "FIXED"]),
	usage_limit: z.number().int().positive().nullable().optional(),
	expires_at: z.string().datetime().nullable().optional(),
	is_active: z.boolean().optional(),
	plans: z.array(z.string()).optional(),
	features: z.array(z.string()).optional(),
	color: z.string().optional(),
	revenue_impact: z.number().min(0).optional(),
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;

	if (
		searchParams.get("summary") === "1" ||
		searchParams.get("summary") === "true"
	) {
		return getSummary();
	}

	return getList(searchParams);
}

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

	const parsed = CreateVoucherSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
			{ status: 422 }
		);
	}

	const {
		code,
		discount,
		type,
		usage_limit,
		expires_at,
		is_active,
		plans,
		features,
		color,
		revenue_impact,
	} = parsed.data;

	const existing = await prisma.voucher.findUnique({ where: { code } });
	if (existing) {
		return NextResponse.json(
			{ message: "Voucher code already exists" },
			{ status: 409 }
		);
	}

	const logId = await startAdminLog(request, payload.email, { action: "CREATE", tableName: "vouchers" });
	try {
		const voucher = await prisma.voucher.create({
			data: {
				code,
				discount,
				type,
				usage_limit: usage_limit ?? null,
				expires_at: expires_at ? new Date(expires_at) : null,
				is_active: is_active ?? true,
				plans: plans ?? [],
				features: features ?? [],
				color: color ?? "#3b82f6",
				revenue_impact: revenue_impact ?? 0,
			},
		});
		finalizeLog(logId, "SUCCESS", voucher.id);
		return NextResponse.json({ data: { voucher: formatVoucher(voucher) } }, { status: 201 });
	} catch (err) {
		finalizeLog(logId, "FAILED", undefined, err instanceof Error ? err.message : "Unknown error");
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
