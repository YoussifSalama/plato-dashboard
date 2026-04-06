import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { verifyAdminRequest } from "@/lib/admin-guard";

// POST /api/agency-token
// Generates a short-lived agency JWT server-side (where JWT_ACCESS_SECRET is available).
// Called by client-side stores that need to impersonate an agency account against the backend.

export async function POST(request: NextRequest) {
	const payload = await verifyAdminRequest(request);
	if (!payload) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	let body: { account_id?: unknown };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
	}

	const accountId = body.account_id;
	if (!accountId && accountId !== 0) {
		return NextResponse.json(
			{ message: "account_id is required" },
			{ status: 422 }
		);
	}

	const secret = process.env.JWT_ACCESS_SECRET;
	if (!secret) {
		return NextResponse.json(
			{ message: "Server misconfiguration: JWT_ACCESS_SECRET not set" },
			{ status: 500 }
		);
	}

	const token = await new SignJWT({ id: accountId, provider: "super_admin" })
		.setProtectedHeader({ alg: "HS256" })
		.setExpirationTime("15m")
		.setIssuedAt()
		.sign(new TextEncoder().encode(secret));

	return NextResponse.json({ token });
}
