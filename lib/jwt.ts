import { SignJWT, jwtVerify } from "jose";

const accessSecret = () =>
  new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

const refreshSecret = () =>
  new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export async function signAccessToken(payload: {
  adminId: number;
  email: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret());
}

export async function signRefreshToken(payload: { adminId: number }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessSecret());
  return payload as { adminId: number; email: string; exp: number };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, refreshSecret());
  return payload as { adminId: number; exp: number };
}
