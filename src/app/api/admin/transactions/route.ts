import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const take = Math.min(parseInt(url.searchParams.get("take") || "50", 10) || 50, 100);
  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10) || 1, 1);
  const skip = (page - 1) * take;

  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.transaction.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));
  return NextResponse.json({ transactions, page, totalPages, total });
}
