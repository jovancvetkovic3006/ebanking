import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";

const Body = z.object({
  accountId: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Neispravni podaci" }, { status: 400 });

  const { accountId, amount } = parsed.data;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "Ra\u010dun nije prona\u0111en" }, { status: 404 });
  if (account.userId !== session.userId) return NextResponse.json({ error: "Nemate pristup ovom ra\u010dunu" }, { status: 403 });

  const trx = await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: accountId },
      data: { balance: { increment: amount } },
    });

    const t = await tx.transaction.create({
      data: {
        type: "DEPOSIT",
        status: "SUCCESS",
        amount,
        toAccountId: accountId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.userId,
        action: "DEPOSIT",
        entityType: "Transaction",
        entityId: t.id,
        meta: { accountId, amount },
      },
    });

    return t;
  });

  return NextResponse.json({ ok: true, transactionId: trx.id });
}
