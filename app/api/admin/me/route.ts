import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const admin = await prisma.admin.findUnique({
		where: { id: payload.adminId },
		select: {
			id: true,
			email: true,
			f_name: true,
			l_name: true,
			user_name: true,
			profile_image_url: true,
		},
	});

	if (!admin) {
		return NextResponse.json({ message: "Admin not found" }, { status: 404 });
	}

	return NextResponse.json({ data: { admin } });
}
