import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccountNumber } from "@/lib/account-number";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Neispravni podaci" }, { status: 400 });

  const { email, password, firstName, lastName, phone, address } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email je ve\u0107 u upotrebi" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, role: "USER", firstName, lastName, phone, address } });

  await prisma.account.create({ data: { id: generateAccountNumber(), userId: user.id, currency: "RSD", balance: 0 } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "REGISTER", entityType: "User", entityId: user.id } });

  return NextResponse.json({ ok: true });
}
