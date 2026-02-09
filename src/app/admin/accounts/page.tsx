import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TableFilter from "@/components/TableFilter";

export default async function AdminAccountsPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const sort = params.sort ?? "";

  const accounts = await prisma.account.findMany({
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      _count: { select: { outgoing: true, incoming: true } },
    },
    ...(q && {
      where: {
        OR: [
          { id: { contains: q, mode: "insensitive" as const } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
          { user: { firstName: { contains: q, mode: "insensitive" as const } } },
          { user: { lastName: { contains: q, mode: "insensitive" as const } } },
        ],
      },
    }),
    orderBy: sort === "balance_asc" ? { balance: "asc" } :
             sort === "balance_desc" ? { balance: "desc" } :
             sort === "newest" ? { createdAt: "desc" } :
             { createdAt: "desc" },
    take: 100,
  });

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Svi računi</h1>
          <p className="text-base-content/60 mt-1">Pregled svih računa u sistemu</p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-primary">{accounts.length} računa</span>
          <span className="badge badge-success">Ukupno: {(totalBalance / 100).toFixed(2)} RSD</span>
        </div>
      </div>

      <TableFilter
        searchPlaceholder="Pretraži po vlasniku, email-u ili broju računa..."
        sorts={[
          { label: "Najnoviji", value: "newest" },
          { label: "Stanje ↑", value: "balance_asc" },
          { label: "Stanje ↓", value: "balance_desc" },
        ]}
      />

      <div className="overflow-x-auto bg-base-100 rounded-lg border border-base-300 shadow-sm">
        <table className="table table-zebra">
          <thead className="bg-primary text-primary-content">
            <tr>
              <th>Vlasnik</th>
              <th>Email</th>
              <th>ID računa</th>
              <th>Valuta</th>
              <th>Stanje</th>
              <th>Odlazne</th>
              <th>Dolazne</th>
              <th>Kreiran</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="hover">
                <td className="font-semibold">
                  {a.user.firstName || a.user.lastName
                    ? `${a.user.firstName ?? ""} ${a.user.lastName ?? ""}`.trim()
                    : <span className="opacity-40">—</span>}
                </td>
                <td className="text-sm">{a.user.email}</td>
                <td className="font-mono text-xs break-all"><Link href={`/admin/accounts/${a.id}`} className="link link-hover link-primary">{a.id}</Link></td>
                <td><span className="badge badge-primary badge-sm">{a.currency}</span></td>
                <td className="font-mono font-semibold">{(a.balance / 100).toFixed(2)}</td>
                <td className="text-center">{a._count.outgoing}</td>
                <td className="text-center">{a._count.incoming}</td>
                <td className="text-sm">{new Date(a.createdAt).toLocaleDateString("sr-RS")}</td>
                <td><Link href={`/admin/accounts/${a.id}`} className="btn btn-ghost btn-xs">Detalji →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
