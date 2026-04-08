import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

// CSV-escape a single cell value
function csvCell(value: string | null | undefined): string {
	const str = value == null ? "" : String(value);
	// Wrap in quotes if it contains comma, quote, or newline
	if (str.includes(",") || str.includes('"') || str.includes("\n")) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function csvRow(cells: (string | null | undefined)[]): string {
	return cells.map(csvCell).join(",");
}

// ─── GET /api/logs/export ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const search      = searchParams.get("search")?.trim() ?? "";
	const tableParam  = searchParams.get("table")?.trim() ?? "";
	const actionParam = searchParams.get("action")?.trim().toUpperCase() ?? "";
	const statusParam = searchParams.get("status")?.trim().toUpperCase() ?? "";
	const sourceParam = searchParams.get("source")?.trim().toUpperCase() ?? "";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const where: any = {};

	if (search) {
		where.OR = [
			{ table_name: { contains: search, mode: "insensitive" } },
			{ record_id:  { contains: search, mode: "insensitive" } },
			{ changed_by: { contains: search, mode: "insensitive" } },
			{ ip:         { contains: search, mode: "insensitive" } },
		];
	}
	if (tableParam  && tableParam  !== "All Tables") where.table_name = tableParam;
	if (actionParam && actionParam !== "ALL")        where.action     = actionParam;
	if (statusParam && statusParam !== "ALL")        where.status     = statusParam;
	if (sourceParam && sourceParam !== "ALL")        where.source     = sourceParam;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const logs = await (prisma as any).systemLog.findMany({
		where,
		orderBy: { created_at: "desc" },
		take: 10_000,
	});

	// Build CSV
	const header = csvRow([
		"Timestamp",
		"Table",
		"Record ID",
		"Action",
		"Changed By",
		"Role",
		"Source",
		"Method",
		"Path",
		"Status",
		"Error",
		"IP",
	]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rows = (logs as any[]).map((l: any) =>
		csvRow([
			new Date(l.created_at).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC"),
			l.table_name,
			l.record_id,
			l.action,
			l.changed_by,
			l.changed_by_role,
			l.source,
			l.method,
			l.path,
			l.status,
			l.error_msg,
			l.ip,
		])
	);

	const csv = [header, ...rows].join("\r\n");
	const date = new Date().toISOString().split("T")[0];
	const filename = `system-logs-${date}.csv`;

	return new NextResponse(csv, {
		status: 200,
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="${filename}"`,
		},
	});
}
