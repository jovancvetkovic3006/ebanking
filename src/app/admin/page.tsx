import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function AdminIndexPage() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Administracija</h1>
        <p className="text-base-content/60 mt-1">Upravljanje sistemom elektronskog bankarstva</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users" className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary transition-all">
          <div className="card-body items-center text-center">
            <div className="text-4xl mb-2">👥</div>
            <h2 className="card-title text-primary">Korisnici</h2>
            <p className="text-sm opacity-60">Pregled svih korisnika</p>
          </div>
        </Link>
        <Link href="/admin/accounts" className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary transition-all">
          <div className="card-body items-center text-center">
            <div className="text-4xl mb-2">🏦</div>
            <h2 className="card-title text-primary">Računi</h2>
            <p className="text-sm opacity-60">Pregled svih računa</p>
          </div>
        </Link>
        <Link href="/admin/transactions" className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary transition-all">
          <div className="card-body items-center text-center">
            <div className="text-4xl mb-2">💸</div>
            <h2 className="card-title text-primary">Transakcije</h2>
            <p className="text-sm opacity-60">Sve transakcije u sistemu</p>
          </div>
        </Link>
        <Link href="/admin/audit" className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary transition-all">
          <div className="card-body items-center text-center">
            <div className="text-4xl mb-2">📋</div>
            <h2 className="card-title text-primary">Evidencija</h2>
            <p className="text-sm opacity-60">Pregled svih aktivnosti</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
