"use client";

import { useState } from "react";
import Link from "next/link";

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
      if (!res.ok) throw new Error(json?.error || "Failed to change password");
      setOk("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <Link href="/dashboard" className="text-sm underline">Back to Dashboard</Link>
      </header>

      <form onSubmit={onSubmit} className="space-y-4 border rounded p-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-green-700">{ok}</p>}

        <div className="space-y-1">
          <label className="block text-sm">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            minLength={6}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-black text-white rounded py-2 disabled:opacity-50">
          {loading ? "Saving..." : "Change password"}
        </button>
      </form>
    </div>
  );
}
