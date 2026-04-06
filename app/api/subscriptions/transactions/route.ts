import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

const STATUS_MAP: Record<string, string> = {
	COMPLETED: "Completed",
	PENDING: "Pending",
	FAILED: "Failed",
	REFUNDED: "Refunded",
};

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
	const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "8")));
	const search = searchParams.get("search")?.trim() ?? "";
	const statusFilter = searchParams.get("status") ?? "all";
	const planFilter = searchParams.get("plan") ?? "all";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const where: any = {};

	// Status filter — map display value back to enum
	const statusEnumMap: Record<string, string> = {
		Completed: "COMPLETED",
		Pending: "PENDING",
		Failed: "FAILED",
		Refunded: "REFUNDED",
	};
	if (statusFilter !== "all" && statusEnumMap[statusFilter]) {
		where.status = statusEnumMap[statusFilter];
	}

	// Plan filter — match by plan name
	if (planFilter !== "all") {
		where.plan = { name: planFilter };
	}

	// Search by company name (use snapshot or join via agency)
	if (search) {
		where.OR = [
			{ agency_name_snapshot: { contains: search, mode: "insensitive" } },
			{ agency: { account: { agency: { company_name: { contains: search, mode: "insensitive" } } } } },
		];
	}

	const [transactions, total] = await Promise.all([
		prisma.subscriptionTransaction.findMany({
			where,
			orderBy: { created_at: "desc" },
			skip: (page - 1) * limit,
			take: limit,
			include: {
				plan: { select: { name: true, display_name: true } },
				agency: {
					select: {
						company_name: true,
						account: { select: { f_name: true, l_name: true } },
					},
				},
			},
		}),
		prisma.subscriptionTransaction.count({ where }),
	]);

	const formatted = transactions.map((tx) => ({
		id: tx.id,
		company:
			tx.agency_name_snapshot ??
			tx.agency.company_name ??
			[tx.agency.account?.f_name, tx.agency.account?.l_name]
				.filter(Boolean)
				.join(" ") ??
			"Unknown",
		plan: tx.plan.display_name ?? tx.plan.name,
		amount: `$${tx.amount.toFixed(2)}`,
		amount_raw: tx.amount,
		date: tx.created_at.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}),
		status: STATUS_MAP[tx.status] ?? tx.status,
	}));

	return NextResponse.json({
		data: {
			transactions: formatted,
			total,
			page,
			limit,
		},
	});
}
