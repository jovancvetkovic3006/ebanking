"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("user@demo.com");
  const [password, setPassword] = useState("User123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Prijava neuspešna");
      const next = sp.get("next") || (json.role === "ADMIN" ? "/admin" : "/dashboard");
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Prijava neuspešna";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex">
      {/* Left — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-base-100">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Prijava</h1>
            <p className="text-base-content/60 mt-1">Dobrodošli nazad u eBanking</p>
          </div>

          {error && <div className="alert alert-error text-sm">{error}</div>}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Email</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                placeholder="vas@email.com"
                required
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Lozinka</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full rounded-xl">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "Prijavi se"}
            </button>
          </form>

          <p className="text-sm text-center">
            Nemate nalog? <a href="/register" className="link link-primary font-semibold">Registrujte se</a>
          </p>
        </div>
      </div>

      {/* Right — Branding panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-primary text-primary-content items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/20"></div>
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10"></div>
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-white/15"></div>
        </div>
        <div className="relative z-10 text-center space-y-6 px-12 max-w-md">
          <div className="text-6xl font-extrabold tracking-tight">eBanking</div>
          <p className="text-lg opacity-80">Siguran i pouzdan sistem za elektronsko bankarstvo</p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-1">🔒</div>
              <div className="text-xs font-semibold">Bezbednost</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-1">💸</div>
              <div className="text-xs font-semibold">Transakcije</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-xs font-semibold">Evidencija</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
