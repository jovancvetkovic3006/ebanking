"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Promena lozinke neuspešna");
      setOk("Lozinka uspešno promenjena");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Promena lozinke neuspešna";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Profil</h1>
        <p className="text-base-content/60 mt-1">Upravljajte vašim nalogom</p>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="font-bold text-lg mb-2">Promena lozinke</h2>

          {error && <div className="alert alert-error text-sm">{error}</div>}
          {ok && <div className="alert alert-success text-sm">{ok}</div>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Trenutna lozinka</span></label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Nova lozinka</span></label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input input-bordered w-full"
                minLength={6}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "Sačuvaj"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
