"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; balance: number; currency: string };

export default function DepositWithdrawForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(type: "deposit" | "withdraw") {
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      if (!Number.isFinite(cents) || cents <= 0) throw new Error("Unesite validan iznos");
      const res = await fetch(`/api/transactions/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, amount: cents }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `${type === "deposit" ? "Uplata" : "Isplata"} neuspešna`);
      setOk(`${type === "deposit" ? "Uplata" : "Isplata"} uspešna! ID: ${json.transactionId}`);
      setAmount("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Greška");
    } finally {
      setLoading(false);
    }
  }

  if (accounts.length === 0) return null;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm h-full">
      <div className="card-body p-5 space-y-4">
        <h2 className="font-bold text-lg">Uplata / Isplata</h2>
        {error && <div className="alert alert-error text-sm">{error}</div>}
        {ok && <div className="alert alert-success text-sm">{ok}</div>}

        <div className="form-control">
          <label className="label"><span className="label-text">Račun</span></label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
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
          <label className="label"><span className="label-text">Iznos (RSD)</span></label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input input-bordered w-full"
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("deposit")}
            className="btn btn-success flex-1"
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : "Uplata"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("withdraw")}
            className="btn btn-error flex-1"
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : "Isplata"}
          </button>
        </div>
      </div>
    </div>
  );
}
