"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password || !confirmPassword) {
      setError("Sva polja su obavezna.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName: firstName || undefined, lastName: lastName || undefined, phone: phone || undefined, address: address || undefined }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = (data && (data.error || data.message)) || "Registracija neuspešna";
        throw new Error(message);
      }

      setSuccess("Registracija uspešna. Preusmeravanje na prijavu...");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Došlo je do greške";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex">
      {/* Left — Register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-base-100 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Registracija</h1>
            <p className="text-base-content/60 mt-1">Kreirajte vaš eBanking nalog</p>
          </div>

          {error && <div className="alert alert-error text-sm">{error}</div>}
          {success && <div className="alert alert-success text-sm">{success}</div>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Ime</span></label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input input-bordered w-full" placeholder="Marko" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Prezime</span></label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input input-bordered w-full" placeholder="Petrović" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Telefon</span></label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input input-bordered w-full" placeholder="+381641234567" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Adresa</span></label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input input-bordered w-full" placeholder="Ulica, Grad" />
              </div>
            </div>
            <div className="divider my-0"></div>
            <div className="form-control">
              <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Email</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input input-bordered w-full" placeholder="vas@email.com" required autoComplete="email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Lozinka</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input input-bordered w-full" placeholder="••••••••" required autoComplete="new-password" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs uppercase tracking-wider font-semibold text-base-content/50">Potvrdi lozinku</span></label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input input-bordered w-full" placeholder="••••••••" required autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full rounded-xl">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "Registruj se"}
            </button>
          </form>

          <p className="text-sm text-center">
            Imate nalog? <a className="link link-primary font-semibold" href="/login">Prijavite se</a>
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
          <p className="text-lg opacity-80">Otvorite nalog za nekoliko minuta i upravljajte finansijama online</p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-1">🏦</div>
              <div className="text-xs font-semibold">Besplatan račun</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xs font-semibold">Brzi transferi</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs font-semibold">Pregled stanja</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl mb-1">🔒</div>
              <div className="text-xs font-semibold">Sigurnost</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
