import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  const admin = await prisma.admin.findUnique({
    where: { email },
    include: { credential: true },
  });

  // Constant-time failure to prevent user enumeration
  const dummyHash =
    "$2b$12$invalidhashfortimingprotectionxxxxxxxxxxxxxxxxxxxxxxxxx";
  const passwordValid = await bcrypt.compare(
    password,
    admin?.credential?.password_hash ?? dummyHash
  );

  if (!admin || !passwordValid) {
    return Response.json(
      { message: "Invalid email or password" },
      { status: 401 }
    );
  }

  const [access_token, refresh_token] = await Promise.all([
    signAccessToken({ adminId: admin.id, email: admin.email }),
    signRefreshToken({ adminId: admin.id }),
  ]);

  await prisma.adminToken.create({
    data: { admin_id: admin.id, refresh_token },
  });

  return Response.json({
    data: {
      access_token,
      refresh_token,
      admin: {
        id: admin.id,
        email: admin.email,
        f_name: admin.f_name,
        l_name: admin.l_name,
        user_name: admin.user_name,
        profile_image_url: admin.profile_image_url,
      },
    },
  });
}
