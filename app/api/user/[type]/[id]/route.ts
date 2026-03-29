import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

type Params = Promise<{ type: string; id: string }>;

const VALID_TYPES = ["company", "candidate"] as const;
type UserType = (typeof VALID_TYPES)[number];

function isValidType(value: string): value is UserType {
  return (VALID_TYPES as readonly string[]).includes(value);
}

const EditCompanySchema = z.object({
  email: z.string().email().optional(),
  f_name: z.string().min(1).optional(),
  l_name: z.string().min(1).optional(),
  verified: z.boolean().optional(),
});

const EditCandidateSchema = z.object({
  email: z.string().email().optional(),
  f_name: z.string().min(1).optional(),
  l_name: z.string().min(1).optional(),
  verified: z.boolean().optional(),
});

// PATCH /api/user/[type]/[id]
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await params;
  const numericId = parseInt(id, 10);

  if (!isValidType(type) || isNaN(numericId)) {
    return Response.json({ message: "Invalid type or id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (type === "company") {
    const parsed = EditCompanySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const account = await prisma.account.findUnique({ where: { id: numericId } });
    if (!account) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }

    if (parsed.data.email && parsed.data.email !== account.email) {
      const conflict = await prisma.account.findUnique({
        where: { email: parsed.data.email },
      });
      if (conflict) {
        return Response.json({ message: "Email already in use" }, { status: 409 });
      }
    }

    const updated = await prisma.account.update({
      where: { id: numericId },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        f_name: true,
        l_name: true,
        verified: true,
        updated_at: true,
      },
    });

    return Response.json({ data: updated });
  }

  // type === "candidate"
  const parsed = EditCandidateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: numericId } });
  if (!candidate) {
    return Response.json({ message: "Candidate not found" }, { status: 404 });
  }

  if (parsed.data.email && parsed.data.email !== candidate.email) {
    const conflict = await prisma.candidate.findUnique({
      where: { email: parsed.data.email },
    });
    if (conflict) {
      return Response.json({ message: "Email already in use" }, { status: 409 });
    }
  }

  const updated = await prisma.candidate.update({
    where: { id: numericId },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      f_name: true,
      l_name: true,
      verified: true,
      updated_at: true,
    },
  });

  return Response.json({ data: updated });
}

// DELETE /api/user/[type]/[id]
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await params;
  const numericId = parseInt(id, 10);

  if (!isValidType(type) || isNaN(numericId)) {
    return Response.json({ message: "Invalid type or id" }, { status: 400 });
  }

  if (type === "company") {
    const account = await prisma.account.findUnique({ where: { id: numericId } });
    if (!account) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }
    await prisma.account.delete({ where: { id: numericId } });
    return Response.json({ message: "Company deleted" });
  }

  // type === "candidate"
  const candidate = await prisma.candidate.findUnique({ where: { id: numericId } });
  if (!candidate) {
    return Response.json({ message: "Candidate not found" }, { status: 404 });
  }
  await prisma.candidate.delete({ where: { id: numericId } });
  return Response.json({ message: "Candidate deleted" });
}
