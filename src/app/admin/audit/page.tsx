import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TableFilter from "@/components/TableFilter";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Prisma } from "@prisma/client";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; action?: string; sort?: string }> }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session || session.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const page = Math.max(parseInt(params.page || "1", 10) || 1, 1);
  const take = 20;
  const skip = (page - 1) * take;
  const q = params.q?.trim() ?? "";
  const actionFilter = params.action ?? "";
  const sort = params.sort ?? "";

  const where: Prisma.AuditLogWhereInput = {
    ...(q && { user: { email: { contains: q, mode: "insensitive" as const } } }),
    ...(actionFilter && { action: actionFilter }),
  };

  const orderBy: Prisma.AuditLogOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      select: { id: true, action: true, entityType: true, entityId: true, meta: true, createdAt: true, userId: true, user: { select: { email: true } } },
      where,
      orderBy,
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));
  const prev = page > 1 ? page - 1 : 1;
  const next = page < totalPages ? page + 1 : totalPages;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Evidencija" }]} />

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Evidencija aktivnosti</h1>
        <p className="text-base-content/60 mt-1">Kompletna revizijska evidencija sistema</p>
      </div>

      <TableFilter
        searchPlaceholder="Pretraži po email-u korisnika..."
        filters={[
          { key: "action", label: "Sve akcije", options: [
            { label: "Prijava", value: "LOGIN" },
            { label: "Odjava", value: "LOGOUT" },
            { label: "Registracija", value: "REGISTER" },
            { label: "Transfer", value: "TRANSFER" },
            { label: "Uplata", value: "DEPOSIT" },
            { label: "Isplata", value: "WITHDRAW" },
            { label: "Neuspešna prijava", value: "LOGIN_FAILED" },
            { label: "Transfer neuspešan", value: "TRANSFER_FAILED" },
            { label: "Isplata neuspešna", value: "WITHDRAW_FAILED" },
            { label: "Promena lozinke", value: "CHANGE_PASSWORD" },
          ]},
        ]}
        sorts={[
          { label: "Najnovije", value: "newest" },
          { label: "Najstarije", value: "oldest" },
        ]}
      />

      <div className="overflow-x-auto bg-base-100 rounded-lg border border-base-300 shadow-sm">
        <table className="table table-zebra">
          <thead className="bg-primary text-primary-content">
            <tr>
              <th>Datum</th>
              <th>Korisnik</th>
              <th>Akcija</th>
              <th>Entitet</th>
              <th>Detalji</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="hover">
                <td>{l.createdAt.toLocaleString()}</td>
                <td className="text-sm">{l.user?.email ?? <span className="opacity-40">-</span>}</td>
                <td><span className={`badge badge-sm ${l.action.includes("FAILED") ? "badge-error" : l.action === "LOGIN" || l.action === "REGISTER" ? "badge-info" : l.action === "LOGOUT" ? "badge-warning" : "badge-success"}`}>{{ LOGIN: "PRIJAVA", LOGOUT: "ODJAVA", REGISTER: "REGISTRACIJA", TRANSFER: "TRANSFER", DEPOSIT: "UPLATA", WITHDRAW: "ISPLATA", CHANGE_PASSWORD: "PROMENA LOZINKE", LOGIN_FAILED: "NEUSPEŠNA PRIJAVA", TRANSFER_FAILED: "TRANSFER NEUSPEŠAN", WITHDRAW_FAILED: "ISPLATA NEUSPEŠNA" }[l.action] ?? l.action}</span></td>
                <td className="text-xs">{l.entityType ?? "-"} / <span className="font-mono">{l.entityId?.slice(0, 8) ?? "-"}</span></td>
                <td className="text-xs max-w-xs truncate">{l.meta ? JSON.stringify(
                  typeof l.meta === "object" && l.meta !== null && "amount" in l.meta
                    ? { ...(l.meta as Record<string, unknown>), amount: Number((l.meta as Record<string, unknown>).amount) / 100 }
                    : l.meta
                ) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="join flex justify-center">
        <Link className={`join-item btn btn-sm ${page === 1 ? "btn-disabled" : ""}`} href={`/admin/audit?page=${prev}`}>«</Link>
        <span className="join-item btn btn-sm btn-active no-animation">Strana {page} / {totalPages}</span>
        <Link className={`join-item btn btn-sm ${page === totalPages ? "btn-disabled" : ""}`} href={`/admin/audit?page=${next}`}>»</Link>
      </div>
    </div>
  );
}
