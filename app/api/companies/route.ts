import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

// ─── GET /api/companies ────────────────────────────────────────────────────────
// Returns a lightweight list of all agencies (companies) for dropdowns.

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const search = searchParams.get("search")?.trim() ?? "";
	const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
	const limit = Math.min(
		200,
		Math.max(1, parseInt(searchParams.get("limit") ?? "100"))
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const where: any = {};
	if (search) {
		where.company_name = { contains: search, mode: "insensitive" };
	}

	const [agencies, total] = await Promise.all([
		prisma.agency.findMany({
			where,
			orderBy: { company_name: "asc" },
			skip: (page - 1) * limit,
			take: limit,
			select: {
				id: true,
				company_name: true,
				company_industry: true,
				company_size: true,
				account: { select: { id: true } },
			},
		}),
		prisma.agency.count({ where }),
	]);

	return NextResponse.json({
		data: agencies.map((a) => ({
			id: a.id,
			company_name: a.company_name,
			company_industry: a.company_industry,
			company_size: a.company_size,
			account_id: a.account?.id,
		})),
		meta: { total, page, limit },
	});
}
