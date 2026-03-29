import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateAdminSchema = z.object({
	email: z.string().email(),
	f_name: z.string().min(1),
	l_name: z.string().min(1),
	user_name: z.string().min(3),
	password: z
		.string()
		.min(8)
		.regex(/[A-Z]/, "Must contain at least one uppercase letter")
		.regex(/[0-9]/, "Must contain at least one number"),
});

export async function POST(request: NextRequest) {
	const secret = request.headers.get("x-admin-secret");
	if (!secret || secret !== process.env.ADMIN_CREATE_SECRET) {
		return Response.json({ message: "Forbidden" }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ message: "Invalid JSON" }, { status: 400 });
	}

	const parsed = CreateAdminSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(
			{
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			},
			{ status: 422 }
		);
	}

	const { email, f_name, l_name, user_name, password } = parsed.data;

	const existing = await prisma.admin.findFirst({
		where: { OR: [{ email }, { user_name }] },
	});
	if (existing) {
		const field = existing.email === email ? "email" : "user_name";
		return Response.json(
			{ message: `An admin with this ${field} already exists` },
			{ status: 409 }
		);
	}

	const password_hash = await bcrypt.hash(password, 12);

	const admin = await prisma.admin.create({
		data: {
			email,
			f_name,
			l_name,
			user_name,
			credential: { create: { password_hash } },
		},
		select: {
			id: true,
			email: true,
			f_name: true,
			l_name: true,
			user_name: true,
			created_at: true,
		},
	});

	return Response.json({ data: admin }, { status: 201 });
}
