import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  let refresh_token: string | undefined;

  try {
    const body = await request.json();
    refresh_token = body?.refresh_token;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!refresh_token) {
    return Response.json({ message: "Refresh token required" }, { status: 400 });
  }

  let payload: { adminId: number };
  try {
    payload = await verifyRefreshToken(refresh_token);
  } catch {
    return Response.json({ message: "Invalid or expired refresh token" }, { status: 401 });
  }

  const stored = await prisma.adminToken.findFirst({
    where: { admin_id: payload.adminId, refresh_token },
    include: { admin: { select: { id: true, email: true } } },
  });

  if (!stored) {
    return Response.json({ message: "Refresh token revoked" }, { status: 401 });
  }

  const access_token = await signAccessToken({
    adminId: stored.admin.id,
    email: stored.admin.email,
  });

  return Response.json({ data: { access_token } });
}
