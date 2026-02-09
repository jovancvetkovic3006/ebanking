import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TableFilter from "@/components/TableFilter";
import type { Prisma } from "@prisma/client";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; sort?: string }> }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session || session.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const roleFilter = params.role ?? "";
  const sort = params.sort ?? "";

  const where: Prisma.UserWhereInput = {
    ...(q && { OR: [{ email: { contains: q, mode: "insensitive" } }, { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] }),
    ...(roleFilter && { role: roleFilter as "USER" | "ADMIN" }),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sort === "email" ? { email: "asc" } :
    sort === "role" ? { role: "asc" } :
    sort === "newest" ? { createdAt: "desc" } :
    { createdAt: "asc" };

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, role: true, createdAt: true,
      firstName: true, lastName: true, phone: true, address: true,
      _count: { select: { accounts: true } },
    },
    where,
    orderBy,
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Korisnici</h1>
          <p className="text-base-content/60 mt-1">Pregled svih registrovanih korisnika</p>
        </div>
        <span className="badge badge-primary">{users.length} ukupno</span>
      </div>

      <TableFilter
        searchPlaceholder="Pretraži po imenu ili email-u..."
        filters={[
          { key: "role", label: "Sve uloge", options: [{ label: "Admin", value: "ADMIN" }, { label: "Korisnik", value: "USER" }] },
        ]}
        sorts={[
          { label: "Najnoviji", value: "newest" },
          { label: "Email (A-Z)", value: "email" },
          { label: "Uloga", value: "role" },
        ]}
      />

      <div className="overflow-x-auto bg-base-100 rounded-lg border border-base-300 shadow-sm">
        <table className="table table-zebra">
          <thead className="bg-primary text-primary-content">
            <tr>
              <th>Ime i prezime</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Adresa</th>
              <th>Uloga</th>
              <th>Računi</th>
              <th>Registrovan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover">
                <td className="font-semibold">
                  <Link href={`/admin/users/${u.id}`} className="link link-hover link-primary">
                    {u.firstName || u.lastName
                      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                      : <span className="opacity-40">—</span>}
                  </Link>
                </td>
                <td>{u.email}</td>
                <td className="text-sm">{u.phone ?? <span className="opacity-40">—</span>}</td>
                <td className="text-sm max-w-xs truncate">{u.address ?? <span className="opacity-40">—</span>}</td>
                <td><span className={`badge ${u.role === "ADMIN" ? "badge-accent" : "badge-ghost"} badge-sm`}>{u.role === "ADMIN" ? "ADMIN" : "KORISNIK"}</span></td>
                <td className="text-center">{u._count.accounts}</td>
                <td className="text-sm">{new Date(u.createdAt).toLocaleDateString("sr-RS")}</td>
                <td><Link href={`/admin/users/${u.id}`} className="btn btn-ghost btn-xs">Detalji →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
