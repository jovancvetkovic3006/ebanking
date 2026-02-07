import Link from "next/link";

type Tx = {
  id: string;
  amount: number;
  createdAt: string;
  fromAccountId: string | null;
  toAccountId: string | null;
};

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export default async function AdminTransactionsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(parseInt(searchParams.page || "1", 10) || 1, 1);
  const take = 20;
  const qs = new URLSearchParams({ page: String(page), take: String(take) }).toString();
  const { transactions, totalPages }: { transactions: Tx[]; totalPages: number } = await fetchJSON(
    `/api/admin/transactions?${qs}`
  );

  const prev = page > 1 ? page - 1 : 1;
  const next = page < totalPages ? page + 1 : totalPages;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Transactions</h1>
        <Link href="/admin" className="text-sm underline">Back to Admin</Link>
      </header>

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

      <div className="flex items-center justify-between">
        <Link className="underline disabled:opacity-50" aria-disabled={page === 1} href={`/admin/transactions?page=${prev}`}>
          Previous
        </Link>
        <div className="text-sm">Page {page} of {totalPages}</div>
        <Link className="underline disabled:opacity-50" aria-disabled={page === totalPages} href={`/admin/transactions?page=${next}`}>
          Next
        </Link>
      </div>
    </div>
  );
}
