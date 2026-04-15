import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

function daysAgo(n: number): Date {
	return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── GET /api/logs/summary ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const now = new Date();
	const d7 = daysAgo(7);
	const d49 = daysAgo(49); // 7 weeks back

	const [
		total,
		failedCount,
		apiCallCount,
		weeklyLogs,
		actionCounts,
		tableCounts,
	] = await Promise.all([
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(prisma as any).systemLog.count(),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(prisma as any).systemLog.count({ where: { status: "FAILED" } }),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(prisma as any).systemLog.count({ where: { source: "API", created_at: { gte: d7 } } }),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(prisma as any).systemLog.findMany({
			where: { created_at: { gte: d49 } },
			select: { created_at: true, status: true, action: true },
		}),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(prisma as any).systemLog.groupBy({
			by: ["action"],
			_count: { action: true },
		}),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(prisma as any).systemLog.groupBy({
			by: ["table_name"],
			_count: { table_name: true },
			orderBy: { _count: { table_name: "desc" } },
			take: 20,
		}),
	]);

	const successCount = (total as number) - (failedCount as number);
	const successRate = (total as number) > 0
		? Math.round((successCount / (total as number)) * 1000) / 10
		: 100;

	// ── Build activity trend (7 weekly buckets) ───────────────────────────────

	const weeks = Array.from({ length: 7 }, (_, i) => {
		const weekStart = new Date(now);
		weekStart.setDate(weekStart.getDate() - (6 - i) * 7);
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekEnd.getDate() + 7);
		const label = `${MONTH_NAMES[weekStart.getMonth()]} ${String(weekStart.getDate()).padStart(2, "0")}`;
		return { label, start: weekStart, end: weekEnd, success: 0, failed: 0, total: 0 };
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(weeklyLogs as any[]).forEach((l: { created_at: Date; status: string }) => {
		const week = weeks.find((w) => l.created_at >= w.start && l.created_at < w.end);
		if (!week) return;
		week.total++;
		if (l.status === "FAILED") week.failed++;
		else week.success++;
	});

	const activityTrend = weeks.map((w) => ({
		date: w.label,
		success: w.success,
		failed: w.failed,
		total: w.total,
	}));

	// ── Action distribution ───────────────────────────────────────────────────

	const actionMap: Record<string, number> = {};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(actionCounts as any[]).forEach((r: { action: string; _count: { action: number } }) => {
		actionMap[r.action] = r._count.action;
	});

	// Return raw counts so the frontend can compute accurate percentages without
	// rounding-to-zero problems (e.g. one action at 99.8% making others show 0%).
	const actionDistribution = [
		{ name: "CREATE", count: actionMap["CREATE"] ?? 0, fill: "#1d4ed8" },
		{ name: "UPDATE", count: actionMap["UPDATE"] ?? 0, fill: "#22c55e" },
		{ name: "DELETE", count: actionMap["DELETE"] ?? 0, fill: "#ef4444" },
	];

	// ── Table options from actual data ────────────────────────────────────────

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tableOptions = ["All Tables", ...(tableCounts as any[]).map((r: { table_name: string }) => r.table_name)];

	return NextResponse.json({
		data: {
			stats: {
				total,
				successRate,
				failedCount,
				apiCalls: apiCallCount,
			},
			activityTrend,
			actionDistribution,
			tableOptions,
		},
	});
}
