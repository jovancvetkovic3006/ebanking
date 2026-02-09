import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, address: true, role: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });

  return NextResponse.json(user);
}

const UpdateBody = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
});

export async function PUT(req: Request) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 });

  const parsed = UpdateBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Neispravni podaci" }, { status: 400 });

  const { firstName, lastName, phone, address } = parsed.data;

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(firstName !== undefined && { firstName: firstName || null }),
      ...(lastName !== undefined && { lastName: lastName || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(address !== undefined && { address: address || null }),
    },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, address: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}
