import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TableFilter from "@/components/TableFilter";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Prisma } from "@prisma/client";

export default async function AdminTransactionsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; type?: string; status?: string; sort?: string }> }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session || session.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const page = Math.max(parseInt(params.page || "1", 10) || 1, 1);
  const take = 20;
  const skip = (page - 1) * take;
  const q = params.q?.trim() ?? "";
  const typeFilter = params.type ?? "";
  const statusFilter = params.status ?? "";
  const sort = params.sort ?? "";

  const where: Prisma.TransactionWhereInput = {
    ...(q && { OR: [{ fromAccountId: { contains: q, mode: "insensitive" as const } }, { toAccountId: { contains: q, mode: "insensitive" as const } }] }),
    ...(typeFilter && { type: typeFilter as "DEPOSIT" | "WITHDRAW" | "TRANSFER" }),
    ...(statusFilter && { status: statusFilter as "SUCCESS" | "FAILED" }),
  };

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    sort === "amount_asc" ? { amount: "asc" } :
    sort === "amount_desc" ? { amount: "desc" } :
    sort === "oldest" ? { createdAt: "asc" } :
    { createdAt: "desc" };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy, skip, take, include: { fromAccount: { select: { user: { select: { email: true } } } }, toAccount: { select: { user: { select: { email: true } } } } } }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));
  const prev = page > 1 ? page - 1 : 1;
  const next = page < totalPages ? page + 1 : totalPages;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Transakcije" }]} />

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Sve transakcije</h1>
        <p className="text-base-content/60 mt-1">Pregled svih transakcija u sistemu</p>
      </div>

      <TableFilter
        searchPlaceholder="Pretraži po broju računa..."
        filters={[
          { key: "type", label: "Svi tipovi", options: [{ label: "Uplata", value: "DEPOSIT" }, { label: "Isplata", value: "WITHDRAW" }, { label: "Transfer", value: "TRANSFER" }] },
          { key: "status", label: "Svi statusi", options: [{ label: "Uspešno", value: "SUCCESS" }, { label: "Neuspešno", value: "FAILED" }] },
        ]}
        sorts={[
          { label: "Najnovije", value: "newest" },
          { label: "Najstarije", value: "oldest" },
          { label: "Iznos ↑", value: "amount_asc" },
          { label: "Iznos ↓", value: "amount_desc" },
        ]}
      />

      <div className="overflow-x-auto bg-base-100 rounded-lg border border-base-300 shadow-sm">
        <table className="table table-zebra">
          <thead className="bg-primary text-primary-content">
            <tr>
              <th>Datum</th>
              <th>Korisnik</th>
              <th>Tip</th>
              <th>Status</th>
              <th>Iznos</th>
              <th>Od</th>
              <th>Ka</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="hover">
                <td>{new Date(t.createdAt).toLocaleString()}</td>
                <td className="text-xs">{(t.type === "DEPOSIT" ? t.toAccount?.user?.email : t.fromAccount?.user?.email) ?? "-"}</td>
                <td><span className={`badge badge-sm ${t.type === "DEPOSIT" ? "badge-success" : t.type === "WITHDRAW" ? "badge-error" : "badge-info"}`}>{t.type === "DEPOSIT" ? "UPLATA" : t.type === "WITHDRAW" ? "ISPLATA" : "TRANSFER"}</span></td>
                <td><span className={`badge badge-sm ${t.status === "SUCCESS" ? "badge-success" : "badge-error"}`}>{t.status === "SUCCESS" ? "USPEŠNO" : "NEUSPEŠNO"}</span></td>
                <td className="font-mono">{(t.amount / 100).toFixed(2)}</td>
                <td className="break-all text-xs">{t.fromAccountId ?? "-"}</td>
                <td className="break-all text-xs">{t.toAccountId ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="join flex justify-center">
        <Link className={`join-item btn btn-sm ${page === 1 ? "btn-disabled" : ""}`} href={`/admin/transactions?page=${prev}`}>«</Link>
        <span className="join-item btn btn-sm btn-active no-animation">Strana {page} / {totalPages}</span>
        <Link className={`join-item btn btn-sm ${page === totalPages ? "btn-disabled" : ""}`} href={`/admin/transactions?page=${next}`}>»</Link>
      </div>
    </div>
  );
}
