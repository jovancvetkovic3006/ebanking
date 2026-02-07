import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Neispravni podaci" }, { status: 400 });

  const { email, password } = parsed.data;

  // Rate limiting per email
  const rl = checkRateLimit(email.toLowerCase());
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Previše pokušaja prijave. Pokušajte ponovo za ${Math.ceil(rl.retryAfterMs / 60000)} minuta.` },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await prisma.auditLog.create({
      data: { action: "LOGIN_FAILED", entityType: "User", meta: { email, reason: "USER_NOT_FOUND" } },
    });
    return NextResponse.json({ error: "Pogrešni podaci za prijavu" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "LOGIN_FAILED", entityType: "User", entityId: user.id, meta: { email, reason: "WRONG_PASSWORD" } },
    });
    return NextResponse.json({ error: "Pogrešni podaci za prijavu" }, { status: 401 });
  }

  // Successful login – reset rate limit counter
  resetRateLimit(email.toLowerCase());

  const token = signSession({ userId: user.id, role: user.role, email: user.email });
  const jar = await cookies();
  jar.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id },
  });

  return NextResponse.json({ ok: true, role: user.role });
}
