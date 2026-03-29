import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { ACCESS_TOKEN_KEY } from "@/lib/authTokens";

export async function verifyAdminRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const cookieToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const token = bearerToken ?? cookieToken;

  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}
