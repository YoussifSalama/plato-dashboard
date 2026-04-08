import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

// ─── GET /api/logs ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
	const limit = Math.min(
		100,
		Math.max(1, parseInt(searchParams.get("limit") ?? "10"))
	);
	const search = searchParams.get("search")?.trim() ?? "";
	const tableParam = searchParams.get("table")?.trim() ?? "";
	const actionParam = searchParams.get("action")?.trim().toUpperCase() ?? "";
	const statusParam = searchParams.get("status")?.trim().toUpperCase() ?? "";
	const sourceParam = searchParams.get("source")?.trim().toUpperCase() ?? "";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const where: any = {};

	if (search) {
		where.OR = [
			{ table_name: { contains: search, mode: "insensitive" } },
			{ record_id: { contains: search, mode: "insensitive" } },
			{ changed_by: { contains: search, mode: "insensitive" } },
			{ ip: { contains: search, mode: "insensitive" } },
		];
	}
	if (tableParam && tableParam !== "All Tables") {
		where.table_name = tableParam;
	}
	if (actionParam && actionParam !== "ALL") {
		where.action = actionParam;
	}
	if (statusParam && statusParam !== "ALL") {
		where.status = statusParam;
	}
	if (sourceParam && sourceParam !== "ALL") {
		where.source = sourceParam;
	}

	const [logs, total, grandTotal] = await Promise.all([
		prisma.systemLog.findMany({
			where,
			orderBy: { created_at: "desc" },
			skip: (page - 1) * limit,
			take: limit,
		}),
		prisma.systemLog.count({ where }),
		prisma.systemLog.count(),
	]);

	const data = logs.map((l) => ({
		id: String(l.id),
		timestamp: l.created_at.toISOString(),
		table: l.table_name,
		recordId: l.id ?? "",
		action: l.action,
		changedBy: l.changed_by,
		changedByRole: l.changed_by_role,
		source: l.source,
		status: l.status,
		errorMsg: l.error_msg ?? undefined,
		ip: l.ip ?? "—",
		method: l.method ?? undefined,
		path: l.path ?? undefined,
		meta: l.meta ?? undefined,
	}));

	const total_pages = Math.max(1, Math.ceil(total / limit));

	return NextResponse.json({
		data,
		meta: { total, page, limit, total_pages, grand_total: grandTotal },
	});
}
