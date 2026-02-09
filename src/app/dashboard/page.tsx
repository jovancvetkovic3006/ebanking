import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DepositWithdrawForm from "./DepositWithdrawForm";

export default async function DashboardPage() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) redirect("/login");

  const [user, accounts, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.account.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { fromAccount: { userId: session.userId } },
          { toAccount: { userId: session.userId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const greeting = user?.firstName ? `Zdravo, ${user.firstName}` : "Dobrodošli";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">{greeting}!</h1>
        <p className="text-base-content/60 mt-1">Pregled vašeg bankovnog naloga</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card bg-primary text-primary-content shadow-lg">
          <div className="card-body p-5">
            <p className="text-sm opacity-80">Ukupno stanje</p>
            <p className="text-3xl font-extrabold">{(totalBalance / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })} <span className="text-lg font-normal opacity-70">RSD</span></p>
            <p className="text-xs opacity-60">{accounts.length} {accounts.length === 1 ? "račun" : "računa"}</p>
          </div>
        </div>

        {accounts.map((a) => (
          <Link key={a.id} href={`/accounts/${a.id}`} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <span className="badge badge-primary badge-sm">{a.currency}</span>
                <span className="text-xs text-base-content/40 font-mono">{a.id}</span>
              </div>
              <p className="text-2xl font-bold mt-2">{(a.balance / 100).toLocaleString("sr-RS", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-base-content/50">Dostupno stanje</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid: Deposit/Withdraw + Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Deposit / Withdraw — narrower */}
        <div className="lg:col-span-2">
          <DepositWithdrawForm accounts={accounts.map(a => ({ id: a.id, balance: a.balance, currency: a.currency }))} />
        </div>

        {/* Recent transactions — wider */}
        <div className="lg:col-span-3">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-0">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-bold text-lg">Poslednje transakcije</h2>
                <Link href="/transactions" className="text-sm link link-primary">Prikaži sve</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs text-base-content/50 uppercase">
                      <th>Datum</th>
                      <th>Tip</th>
                      <th>Status</th>
                      <th className="text-right">Iznos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-base-content/40 py-8">Nema transakcija</td></tr>
                    )}
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover">
                        <td className="text-sm">{new Date(t.createdAt).toLocaleDateString("sr-RS")}</td>
                        <td>
                          <span className={`badge badge-xs ${t.type === "DEPOSIT" ? "badge-success" : t.type === "WITHDRAW" ? "badge-error" : "badge-info"}`}>
                            {t.type === "DEPOSIT" ? "UPLATA" : t.type === "WITHDRAW" ? "ISPLATA" : "TRANSFER"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-xs ${t.status === "SUCCESS" ? "badge-success" : "badge-error"} badge-outline`}>
                            {t.status === "SUCCESS" ? "OK" : "FAIL"}
                          </span>
                        </td>
                        <td className="text-right font-mono font-semibold text-sm">
                          <span className={t.type === "DEPOSIT" ? "text-success" : t.type === "WITHDRAW" ? "text-error" : ""}>
                            {t.type === "DEPOSIT" ? "+" : t.type === "WITHDRAW" ? "-" : ""}{(t.amount / 100).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5">
          <h2 className="font-bold text-lg mb-3">Brze akcije</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/transfer" className="btn btn-primary btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Novi transfer
            </Link>
            <Link href="/transactions" className="btn btn-outline btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Sve transakcije
            </Link>
            <Link href="/profile" className="btn btn-outline btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
