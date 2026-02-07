import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import type { Prisma as PrismaNS } from "@prisma/client";

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

  try {
    const trx = await prisma.$transaction(async (tx: PrismaNS.TransactionClient) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new Error("NOT_FOUND");
      if (account.userId !== session.userId) throw new Error("FORBIDDEN");
      if (account.balance < amount) throw new Error("INSUFFICIENT");

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });

      const t = await tx.transaction.create({
        data: {
          type: "WITHDRAW",
          status: "SUCCESS",
          amount,
          fromAccountId: accountId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "WITHDRAW",
          entityType: "Transaction",
          entityId: t.id,
          meta: { accountId, amount },
        },
      });

      return t;
    });

    return NextResponse.json({ ok: true, transactionId: trx.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";

    // Record FAILED withdrawal for traceability
    if (msg === "INSUFFICIENT") {
      await prisma.transaction.create({
        data: { type: "WITHDRAW", status: "FAILED", amount, fromAccountId: accountId },
      });
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "WITHDRAW_FAILED",
          entityType: "Transaction",
          meta: { accountId, amount, reason: msg },
        },
      });
    }

    const status = msg === "FORBIDDEN" ? 403 : msg === "INSUFFICIENT" ? 400 : 400;
    const srMsg: Record<string, string> = { INSUFFICIENT: "Nedovoljno sredstava", NOT_FOUND: "Ra\u010dun nije prona\u0111en", FORBIDDEN: "Nemate pristup ovom ra\u010dunu" };
    return NextResponse.json({ error: srMsg[msg] || msg || "Isplata neuspe\u0161na" }, { status });
  }
}
