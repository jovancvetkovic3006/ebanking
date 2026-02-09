"use client";

import { useState, useEffect } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
      })
      .catch(() => setProfileError("Greška pri učitavanju profila"))
      .finally(() => setProfileLoading(false));
  }, []);

  async function onProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileOk(null);
    setProfileSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, address }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Ažuriranje neuspešno");
      setProfile(json);
      setProfileOk("Profil uspešno ažuriran");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ažuriranje neuspešno";
      setProfileError(msg);
    } finally {
      setProfileSaving(false);
    }
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwOk(null);
    setPwLoading(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Promena lozinke neuspešna");
      setPwOk("Lozinka uspešno promenjena");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Promena lozinke neuspešna";
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  }

  if (profileLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-xl mx-auto flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto space-y-6">
      <Breadcrumbs items={[{ label: "Početna", href: "/dashboard" }, { label: "Profil" }]} />

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Profil</h1>
        <p className="text-base-content/60 mt-1">Upravljajte vašim nalogom</p>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="font-bold text-lg mb-2">Lični podaci</h2>

          {profileError && <div className="alert alert-error text-sm">{profileError}</div>}
          {profileOk && <div className="alert alert-success text-sm">{profileOk}</div>}

          <div className="mb-4 text-sm space-y-1">
            <p><span className="font-semibold">Email:</span> {profile?.email}</p>
            <p><span className="font-semibold">Uloga:</span> {profile?.role === "ADMIN" ? "Administrator" : "Korisnik"}</p>
            <p><span className="font-semibold">Registrovan:</span> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("sr-RS") : "—"}</p>
          </div>

          <form onSubmit={onProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Ime</span></label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Unesite ime"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Prezime</span></label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Unesite prezime"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Telefon</span></label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Unesite broj telefona"
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Adresa</span></label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Unesite adresu"
              />
            </div>

            <button type="submit" disabled={profileSaving} className="btn btn-primary w-full">
              {profileSaving ? <span className="loading loading-spinner loading-sm"></span> : "Sačuvaj izmene"}
            </button>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="font-bold text-lg mb-2">Promena lozinke</h2>

          {pwError && <div className="alert alert-error text-sm">{pwError}</div>}
          {pwOk && <div className="alert alert-success text-sm">{pwOk}</div>}

          <form onSubmit={onPasswordSubmit} className="space-y-4">
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

            <button type="submit" disabled={pwLoading} className="btn btn-primary w-full">
              {pwLoading ? <span className="loading loading-spinner loading-sm"></span> : "Promeni lozinku"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
