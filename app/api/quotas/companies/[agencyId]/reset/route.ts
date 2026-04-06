import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ agencyId: string }> }
) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const { agencyId: rawId } = await params;
	const agencyId = parseInt(rawId);
	if (isNaN(agencyId)) {
		return NextResponse.json({ message: "Invalid agency ID" }, { status: 400 });
	}

	const sub = await prisma.agencySubscription.findUnique({
		where: { agency_id: agencyId },
	});
	if (!sub) {
		return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
	}

	await prisma.agencySubscription.update({
		where: { agency_id: agencyId },
		data: {
			used_job_posting: 0,
			used_resume_analysis: 0,
			used_phone_calls: 0,
			used_recordings: 0,
		},
	});

	return NextResponse.json({ data: { message: "Usage reset successfully" } });
}
