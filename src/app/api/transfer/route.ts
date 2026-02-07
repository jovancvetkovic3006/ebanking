import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import type { Prisma as PrismaNS } from "@prisma/client";

const Body = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().int().positive(),
});

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { fromAccountId, toAccountId, amount } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx: PrismaNS.TransactionClient) => {
      const from = await tx.account.findUnique({ where: { id: fromAccountId } });
      if (!from) throw new Error("FROM_NOT_FOUND");
      if (from.userId !== session.userId) throw new Error("FORBIDDEN");
      if (from.balance < amount) throw new Error("INSUFFICIENT");

      const to = await tx.account.findUnique({ where: { id: toAccountId } });
      if (!to) throw new Error("TO_NOT_FOUND");

      await tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });

      await tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });

      const trx = await tx.transaction.create({
        data: {
          type: "TRANSFER",
          status: "SUCCESS",
          amount,
          fromAccountId,
          toAccountId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "TRANSFER",
          entityType: "Transaction",
          entityId: trx.id,
          meta: { fromAccountId, toAccountId, amount },
        },
      });

      return trx;
    });

    return NextResponse.json({ ok: true, transactionId: result.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    const status = msg === "FORBIDDEN" ? 403 : msg === "INSUFFICIENT" ? 400 : 400;
    return NextResponse.json({ error: msg || "Transfer failed" }, { status });
  }
}
