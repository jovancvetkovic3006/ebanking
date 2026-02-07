"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Account = { id: string; balance: number; currency: string };

export default function TransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/accounts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts as Account[]);
        if ((data.accounts as Account[]).length > 0) {
          setFromAccountId((data.accounts as Account[])[0].id);
        }
      } else if (res.status === 401) {
        router.push("/login?next=/transfer");
      }
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      if (!Number.isFinite(cents) || cents <= 0) throw new Error("Invalid amount");
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAccountId, toAccountId, amount: cents }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Transfer failed");
      setOk(`Transfer success. ID: ${json.transactionId}`);
      setAmount("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transfer</h1>
        <Link href="/dashboard" className="text-sm underline">Back to Dashboard</Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 border rounded p-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-green-700">{ok}</p>}

        <div className="space-y-1">
          <label className="block text-sm">From account</label>
          <select
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.currency} | {(a.balance / 100).toFixed(2)} | {a.id.slice(0, 8)}...
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm">To account ID</label>
          <input
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            placeholder="Target account UUID"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      <div className="text-sm text-gray-600">
        Tip: For testing, use your other account ID from Dashboard as the target.
      </div>
    </div>
  );
}
