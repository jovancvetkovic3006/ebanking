"use client";

import { useEffect, useState } from "react";
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
      if (!Number.isFinite(cents) || cents <= 0) throw new Error("Unesite validan iznos");
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAccountId, toAccountId, amount: cents }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Transfer neuspe\u0161an");
      setOk(`Transfer uspešan. ID: ${json.transactionId}`);
      setAmount("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transfer neuspešan";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Novi transfer</h1>
        <p className="text-base-content/60 mt-1">Prenesite sredstva na drugi račun</p>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          {error && <div className="alert alert-error text-sm">{error}</div>}
          {ok && <div className="alert alert-success text-sm">{ok}</div>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Sa računa</span></label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="select select-bordered w-full"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.currency} | {(a.balance / 100).toFixed(2)} | {a.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Na račun (ID)</span></label>
              <input
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                placeholder="UUID ciljnog računa"
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Iznos</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "Pošalji"}
            </button>
          </form>
        </div>
      </div>

      <div className="text-sm opacity-60">
        Tip: Za testiranje, koristite ID drugog računa sa Dashboard-a kao cilj.
      </div>
    </div>
  );
}
