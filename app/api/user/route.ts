import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [accounts, candidates, totalCompanies, totalCandidates] =
    await Promise.all([
      prisma.account.findMany({
        select: {
          id: true,
          email: true,
          f_name: true,
          l_name: true,
          verified: true,
          created_at: true,
          agency: {
            select: {
              company_name: true,
              _count: { select: { jobs: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.candidate.findMany({
        select: {
          id: true,
          email: true,
          f_name: true,
          l_name: true,
          candidate_name: true,
          verified: true,
          created_at: true,
          _count: { select: { applications: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.account.count(),
      prisma.candidate.count(),
    ]);

  const companies = accounts.map((a) => ({
    id: a.id,
    type: "company" as const,
    name: a.agency?.company_name ?? `${a.f_name} ${a.l_name}`,
    email: a.email,
    status: a.verified,
    created_at: a.created_at,
    activity: a.agency?._count.jobs ?? 0,
  }));

  const candidateList = candidates.map((c) => ({
    id: c.id,
    type: "candidate" as const,
    name: c.candidate_name ?? `${c.f_name} ${c.l_name}`,
    email: c.email ?? null,
    status: c.verified,
    created_at: c.created_at,
    activity: c._count.applications,
  }));

  return Response.json({
    data: {
      total_companies: totalCompanies,
      total_candidates: totalCandidates,
      users: [...companies, ...candidateList],
    },
  });
}
