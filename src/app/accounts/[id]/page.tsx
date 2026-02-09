import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) redirect("/login");

  const { id } = await params;

  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      _count: { select: { outgoing: true, incoming: true } },
    },
  });

  if (!account) notFound();
  if (account.userId !== session.userId) redirect("/dashboard");

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { fromAccountId: id },
        { toAccountId: id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const totalDeposits = transactions.filter(t => t.type === "DEPOSIT" && t.status === "SUCCESS").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === "WITHDRAW" && t.status === "SUCCESS").reduce((s, t) => s + t.amount, 0);
  const totalTransfersOut = transactions.filter(t => t.type === "TRANSFER" && t.status === "SUCCESS" && t.fromAccountId === id).reduce((s, t) => s + t.amount, 0);
  const totalTransfersIn = transactions.filter(t => t.type === "TRANSFER" && t.status === "SUCCESS" && t.toAccountId === id).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Breadcrumbs items={[{ label: "Početna", href: "/dashboard" }, { label: "Račun", href: "/dashboard" }, { label: id }]} />

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Detalji računa</h1>
        <p className="text-base-content/60 mt-1 font-mono text-sm">{id}</p>
      </div>

      {/* Account Info */}
      <div className="card bg-primary text-primary-content shadow-lg">
        <div className="card-body p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Stanje</p>
              <p className="text-3xl font-extrabold">{(account.balance / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })} <span className="text-lg font-normal opacity-70">{account.currency}</span></p>
            </div>
            <span className="badge badge-lg">{account.currency}</span>
          </div>
          <div className="flex gap-6 mt-2 text-sm opacity-70">
            <span>Kreiran: {new Date(account.createdAt).toLocaleDateString("sr-RS")}</span>
            <span>Odlazne: {account._count.outgoing}</span>
            <span>Dolazne: {account._count.incoming}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-success/10 border border-success/20">
          <div className="card-body p-4">
            <p className="text-xs text-success uppercase tracking-wide">Uplate</p>
            <p className="text-xl font-bold text-success">+{(totalDeposits / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card bg-error/10 border border-error/20">
          <div className="card-body p-4">
            <p className="text-xs text-error uppercase tracking-wide">Isplate</p>
            <p className="text-xl font-bold text-error">-{(totalWithdrawals / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card bg-info/10 border border-info/20">
          <div className="card-body p-4">
            <p className="text-xs text-info uppercase tracking-wide">Transferi odlazni</p>
            <p className="text-xl font-bold text-info">-{(totalTransfersOut / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card bg-info/10 border border-info/20">
          <div className="card-body p-4">
            <p className="text-xs text-info uppercase tracking-wide">Transferi dolazni</p>
            <p className="text-xl font-bold text-info">+{(totalTransfersIn / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-lg">Poslednje transakcije (do 30)</h2>
            <Link href="/transactions" className="text-sm link link-primary">Sve transakcije</Link>
          </div>
          {transactions.length === 0 ? (
            <p className="text-base-content/50 text-sm">Nema transakcija za ovaj račun.</p>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Tip</th>
                    <th>Status</th>
                    <th>Iznos</th>
                    <th>Smer</th>
                    <th>Drugi račun</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const isOutgoing = t.fromAccountId === id;
                    const otherAccountId = isOutgoing ? t.toAccountId : t.fromAccountId;
                    return (
                      <tr key={t.id}>
                        <td className="text-sm">{new Date(t.createdAt).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-sm ${t.type === "DEPOSIT" ? "badge-success" : t.type === "WITHDRAW" ? "badge-error" : "badge-info"}`}>
                            {t.type === "DEPOSIT" ? "UPLATA" : t.type === "WITHDRAW" ? "ISPLATA" : "TRANSFER"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-sm ${t.status === "SUCCESS" ? "badge-success" : "badge-error"}`}>
                            {t.status === "SUCCESS" ? "USPEŠNO" : "NEUSPEŠNO"}
                          </span>
                        </td>
                        <td className="font-mono">
                          <span className={t.type === "DEPOSIT" || (!isOutgoing && t.type === "TRANSFER") ? "text-success" : "text-error"}>
                            {t.type === "DEPOSIT" || (!isOutgoing && t.type === "TRANSFER") ? "+" : "-"}{(t.amount / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="text-xs">
                          {t.type === "TRANSFER" ? (isOutgoing ? "Odlazni" : "Dolazni") : "—"}
                        </td>
                        <td className="text-xs font-mono">{otherAccountId ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/transfer" className="btn btn-primary btn-sm">Novi transfer</Link>
        <Link href="/dashboard" className="btn btn-outline btn-sm">Nazad na početnu</Link>
      </div>
    </div>
  );
}
