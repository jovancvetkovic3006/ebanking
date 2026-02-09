import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      accounts: {
        select: {
          id: true,
          currency: true,
          balance: true,
          createdAt: true,
          _count: { select: { outgoing: true, incoming: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) notFound();

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { fromAccount: { userId: id } },
        { toAccount: { userId: id } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      fromAccount: { select: { user: { select: { email: true } } } },
      toAccount: { select: { user: { select: { email: true } } } },
    },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Korisnici", href: "/admin/users" }, { label: fullName || user.email }]} />

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">{fullName || user.email}</h1>
        <p className="text-base-content/60 mt-1">Detalji korisnika</p>
      </div>

      {/* User Info Card */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Lični podaci</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Ime</p>
              <p className="font-medium">{user.firstName || <span className="opacity-40">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Prezime</p>
              <p className="font-medium">{user.lastName || <span className="opacity-40">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Telefon</p>
              <p className="font-medium">{user.phone || <span className="opacity-40">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Adresa</p>
              <p className="font-medium">{user.address || <span className="opacity-40">—</span>}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Uloga</p>
              <span className={`badge ${user.role === "ADMIN" ? "badge-accent" : "badge-ghost"} badge-sm`}>
                {user.role === "ADMIN" ? "ADMIN" : "KORISNIK"}
              </span>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Registrovan</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString("sr-RS")}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide">Poslednja izmena</p>
              <p className="font-medium">{new Date(user.updatedAt).toLocaleDateString("sr-RS")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Računi ({user.accounts.length})</h2>
          {user.accounts.length === 0 ? (
            <p className="text-base-content/50 text-sm">Korisnik nema račune.</p>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Broj računa</th>
                    <th>Valuta</th>
                    <th>Stanje</th>
                    <th>Odlazne</th>
                    <th>Dolazne</th>
                    <th>Kreiran</th>
                  </tr>
                </thead>
                <tbody>
                  {user.accounts.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-sm"><Link href={`/admin/accounts/${a.id}`} className="link link-hover link-primary">{a.id}</Link></td>
                      <td>{a.currency}</td>
                      <td className="font-mono">{(a.balance / 100).toFixed(2)}</td>
                      <td className="text-center">{a._count.outgoing}</td>
                      <td className="text-center">{a._count.incoming}</td>
                      <td className="text-sm">{new Date(a.createdAt).toLocaleDateString("sr-RS")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Poslednje transakcije (do 20)</h2>
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
                    <th>Od</th>
                    <th>Ka</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
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
                      <td className="font-mono">{(t.amount / 100).toFixed(2)}</td>
                      <td className="text-xs break-all">{t.fromAccountId ?? "—"}</td>
                      <td className="text-xs break-all">{t.toAccountId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">Poslednje aktivnosti (do 20)</h2>
          {auditLogs.length === 0 ? (
            <p className="text-base-content/50 text-sm">Nema aktivnosti.</p>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Akcija</th>
                    <th>Entitet</th>
                    <th>Detalji</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="text-sm">{new Date(l.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-sm ${l.action.includes("FAILED") ? "badge-error" : l.action === "LOGIN" || l.action === "REGISTER" ? "badge-info" : l.action === "LOGOUT" ? "badge-warning" : "badge-success"}`}>
                          {{ LOGIN: "PRIJAVA", LOGOUT: "ODJAVA", REGISTER: "REGISTRACIJA", TRANSFER: "TRANSFER", DEPOSIT: "UPLATA", WITHDRAW: "ISPLATA", CHANGE_PASSWORD: "PROMENA LOZINKE", LOGIN_FAILED: "NEUSPEŠNA PRIJAVA", TRANSFER_FAILED: "TRANSFER NEUSPEŠAN", WITHDRAW_FAILED: "ISPLATA NEUSPEŠNA" }[l.action] ?? l.action}
                        </span>
                      </td>
                      <td className="text-xs">{l.entityType ?? "—"} / <span className="font-mono">{l.entityId?.slice(0, 8) ?? "—"}</span></td>
                      <td className="text-xs max-w-xs truncate">{l.meta ? JSON.stringify(
                        typeof l.meta === "object" && l.meta !== null && "amount" in l.meta
                          ? { ...(l.meta as Record<string, unknown>), amount: Number((l.meta as Record<string, unknown>).amount) / 100 }
                          : l.meta
                      ) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
