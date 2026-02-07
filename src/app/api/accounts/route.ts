import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ accounts });
}
