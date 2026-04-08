import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogAction = "CREATE" | "UPDATE" | "DELETE" | "READ";
export type LogSource = "ADMIN" | "API" | "WEBHOOK" | "CRON";
export type LogStatus = "SUCCESS" | "FAILED" | "PENDING";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extracts the real client IP from common forwarding headers. */
export function getRequestIp(request: NextRequest): string {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		request.headers.get("x-real-ip") ??
		"—"
	);
}

// ─── Start / Finalize pattern ─────────────────────────────────────────────────

/**
 * Creates a PENDING log entry at the start of an admin-guarded request.
 * Returns the log ID so it can be finalized later with finalizeLog().
 * Returns -1 if the insert fails — finalizeLog() is a safe no-op for -1.
 */
export async function startAdminLog(
	request: NextRequest,
	adminEmail: string,
	opts: {
		action: LogAction;
		tableName: string;
		meta?: Record<string, unknown>;
	}
): Promise<number> {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const log = await (prisma as any).systemLog.create({
			data: {
				action:          opts.action,
				table_name:      opts.tableName,
				record_id:       null,
				changed_by:      adminEmail,
				changed_by_role: "super_admin",
				source:          "ADMIN",
				method:          request.method.toUpperCase(),
				path:            request.nextUrl.pathname,
				ip:              getRequestIp(request),
				status:          "PENDING",
				meta:            opts.meta ?? undefined,
			},
		});
		return log.id as number;
	} catch (err) {
		console.error("[SystemLog] Failed to start log:", err);
		return -1;
	}
}

/**
 * Same as startAdminLog but for routes without verifyAdminRequest
 * (e.g. routes secured by x-admin-secret).
 */
export async function startSystemLog(opts: {
	action: LogAction;
	tableName: string;
	changedBy: string;
	changedByRole?: string;
	source?: LogSource;
	method?: string;
	path?: string;
	ip?: string;
	meta?: Record<string, unknown>;
}): Promise<number> {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const log = await (prisma as any).systemLog.create({
			data: {
				action:          opts.action,
				table_name:      opts.tableName,
				record_id:       null,
				changed_by:      opts.changedBy,
				changed_by_role: opts.changedByRole ?? "super_admin",
				source:          opts.source ?? "ADMIN",
				method:          opts.method ?? null,
				path:            opts.path ?? null,
				ip:              opts.ip ?? null,
				status:          "PENDING",
				meta:            opts.meta ?? undefined,
			},
		});
		return log.id as number;
	} catch (err) {
		console.error("[SystemLog] Failed to start log:", err);
		return -1;
	}
}

/**
 * Finalizes a PENDING log entry with the outcome.
 * Fire-and-forget. Passing logId = -1 is a safe no-op.
 */
export function finalizeLog(
	logId: number,
	status: "SUCCESS" | "FAILED",
	recordId?: string | number | null,
	errorMsg?: string
): void {
	if (logId < 0) return;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(prisma as any).systemLog
		.update({
			where: { id: logId },
			data: {
				status,
				...(recordId != null ? { record_id: String(recordId) } : {}),
				error_msg: errorMsg ?? null,
			},
		})
		.catch((err: unknown) => {
			console.error("[SystemLog] Failed to finalize log:", err);
		});
}
