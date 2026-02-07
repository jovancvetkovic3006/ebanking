import Link from "next/link";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

type Account = { id: string; balance: number; currency: string };
type Tx = { id: string; amount: number; createdAt: string; fromAccountId: string | null; toAccountId: string | null };

export default async function DashboardPage() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  const [{ accounts }, { transactions }] = await Promise.all([
    fetchJSON<{ accounts: Account[] }>("/api/accounts"),
    fetchJSON<{ transactions: Tx[] }>("/api/transactions"),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link href="/transfer" className="px-3 py-2 rounded bg-black text-white">New transfer</Link>
          <Link href="/transactions" className="px-3 py-2 rounded border">Transactions</Link>
          <Link href="/profile" className="px-3 py-2 rounded border">Profile</Link>
          {session?.role === "ADMIN" && (
            <Link href="/admin" className="px-3 py-2 rounded border">Admin</Link>
          )}
          <form action="/api/auth/logout" method="post">
            <button className="px-3 py-2 rounded border" type="submit">Logout</button>
          </form>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-medium mb-3">Accounts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <div key={a.id} className="border rounded p-4">
              <div className="text-sm text-gray-500">{a.currency}</div>
              <div className="text-2xl font-semibold">{(a.balance / 100).toFixed(2)}</div>
              <div className="text-xs text-gray-500 break-all mt-2">{a.id}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Recent transactions</h2>
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Amount</th>
                <th className="p-2">From</th>
                <th className="p-2">To</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="p-2">{(t.amount / 100).toFixed(2)}</td>
                  <td className="p-2 break-all">{t.fromAccountId ?? "-"}</td>
                  <td className="p-2 break-all">{t.toAccountId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
