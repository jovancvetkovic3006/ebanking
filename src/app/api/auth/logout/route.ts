import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (session) {
    await prisma.auditLog.create({
      data: { userId: session.userId, action: "LOGOUT", entityType: "User", entityId: session.userId },
    });
  }
  jar.set("session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
