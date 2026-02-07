import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function Home() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");
  }
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-primary/5">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-primary">eBanking</h1>
            <p className="text-xl text-base-content/70">
              Siguran i pouzdan sistem za elektronsko bankarstvo
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-left max-w-lg mx-auto">
            <div className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-4 items-center text-center">
                <span className="text-2xl">🔒</span>
                <p className="text-sm font-semibold">Bezbednost</p>
                <p className="text-xs opacity-60">JWT autentifikacija i bcrypt enkripcija</p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-4 items-center text-center">
                <span className="text-2xl">💸</span>
                <p className="text-sm font-semibold">Transakcije</p>
                <p className="text-xs opacity-60">Atomarne operacije sa punim integritetom</p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-4 items-center text-center">
                <span className="text-2xl">📋</span>
                <p className="text-sm font-semibold">Evidencija</p>
                <p className="text-xs opacity-60">Kompletna revizijska evidencija aktivnosti</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/login" className="btn btn-primary btn-lg">Prijava</Link>
            <Link href="/register" className="btn btn-outline btn-lg">Registracija</Link>
          </div>

          <p className="text-xs text-base-content/40">
            Prototip razvijen u okviru diplomskog rada — Informacioni sistemi elektronskog bankarstva
          </p>
        </div>
      </div>
    </div>
  );
}
