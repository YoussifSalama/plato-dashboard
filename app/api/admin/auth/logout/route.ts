import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  let refresh_token: string | undefined;

  try {
    const body = await request.json();
    refresh_token = body?.refresh_token;
  } catch {
    // Proceed — still clear what we can
  }

  if (refresh_token) {
    try {
      const payload = await verifyRefreshToken(refresh_token);
      await prisma.adminToken.deleteMany({
        where: { admin_id: payload.adminId, refresh_token },
      });
    } catch {
      // Token invalid — nothing to delete
    }
  }

  return Response.json({ message: "Logged out" });
}
