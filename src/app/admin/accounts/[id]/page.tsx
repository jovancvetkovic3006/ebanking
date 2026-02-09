import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id } = await params;

  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, address: true, role: true, createdAt: true } },
      _count: { select: { outgoing: true, incoming: true } },
    },
  });

  if (!account) notFound();

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { fromAccountId: id },
        { toAccountId: id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      fromAccount: { select: { id: true, user: { select: { email: true } } } },
      toAccount: { select: { id: true, user: { select: { email: true } } } },
    },
  });

  const totalDeposits = transactions.filter(t => t.type === "DEPOSIT" && t.status === "SUCCESS").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === "WITHDRAW" && t.status === "SUCCESS").reduce((s, t) => s + t.amount, 0);
  const totalTransfersOut = transactions.filter(t => t.type === "TRANSFER" && t.status === "SUCCESS" && t.fromAccountId === id).reduce((s, t) => s + t.amount, 0);
  const totalTransfersIn = transactions.filter(t => t.type === "TRANSFER" && t.status === "SUCCESS" && t.toAccountId === id).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="text-sm breadcrumbs">
        <ul>
          <li><Link href="/admin">Početna</Link></li>
          <li><Link href="/admin/accounts">Računi</Link></li>
          <li>{id}</li>
        </ul>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-mono">{id}</h1>
        <p className="text-base-content/60 mt-1">Detalji računa</p>
      </div>

      {/* Account Info */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Informacije o računu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Broj računa</p>
              <p className="font-mono font-medium">{account.id}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Valuta</p>
              <span className="badge badge-primary badge-sm">{account.currency}</span>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Stanje</p>
              <p className="text-2xl font-bold">{(account.balance / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })} <span className="text-sm font-normal opacity-60">{account.currency}</span></p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Odlazne transakcije</p>
              <p className="font-medium">{account._count.outgoing}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Dolazne transakcije</p>
              <p className="font-medium">{account._count.incoming}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Kreiran</p>
              <p className="font-medium">{new Date(account.createdAt).toLocaleDateString("sr-RS")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-success/10 border border-success/20">
          <div className="card-body p-4">
            <p className="text-xs text-success uppercase tracking-wide">Ukupne uplate</p>
            <p className="text-xl font-bold text-success">{(totalDeposits / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card bg-error/10 border border-error/20">
          <div className="card-body p-4">
            <p className="text-xs text-error uppercase tracking-wide">Ukupne isplate</p>
            <p className="text-xl font-bold text-error">{(totalWithdrawals / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card bg-info/10 border border-info/20">
          <div className="card-body p-4">
            <p className="text-xs text-info uppercase tracking-wide">Transferi - odlazni</p>
            <p className="text-xl font-bold text-info">{(totalTransfersOut / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card bg-info/10 border border-info/20">
          <div className="card-body p-4">
            <p className="text-xs text-info uppercase tracking-wide">Transferi - dolazni</p>
            <p className="text-xl font-bold text-info">{(totalTransfersIn / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Owner Info */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-lg">Vlasnik računa</h2>
            <Link href={`/admin/users/${account.user.id}`} className="btn btn-ghost btn-sm">Profil korisnika →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Email</p>
              <p className="font-medium">{account.user.email}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Ime</p>
              <p className="font-medium">{account.user.firstName || <span className="opacity-40">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Prezime</p>
              <p className="font-medium">{account.user.lastName || <span className="opacity-40">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Telefon</p>
              <p className="font-medium">{account.user.phone || <span className="opacity-40">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Adresa</p>
              <p className="font-medium">{account.user.address || <span className="opacity-40">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Uloga</p>
              <span className={`badge ${account.user.role === "ADMIN" ? "badge-accent" : "badge-ghost"} badge-sm`}>
                {account.user.role === "ADMIN" ? "ADMIN" : "KORISNIK"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Poslednje transakcije (do 30)</h2>
          {transactions.length === 0 ? (
            <p className="text-base-content/50 text-sm">Nema transakcija.</p>
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
                        <td className="text-xs font-mono">
                          {otherAccountId ? (
                            <Link href={`/admin/accounts/${otherAccountId}`} className="link link-hover link-primary">{otherAccountId}</Link>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
