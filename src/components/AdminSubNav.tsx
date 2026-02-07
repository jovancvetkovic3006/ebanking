"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Početna" },
  { href: "/admin/users", label: "Korisnici" },
  { href: "/admin/accounts", label: "Računi" },
  { href: "/admin/transactions", label: "Transakcije" },
  { href: "/admin/audit", label: "Evidencija" },
];

export default function AdminSubNav() {
  const pathname = usePathname();

  return (
    <div className="bg-base-100 border-b border-base-300 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 overflow-x-auto">
        <div role="tablist" className="tabs tabs-bordered flex-nowrap">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              className={`tab tab-sm whitespace-nowrap ${pathname === t.href ? "tab-active font-semibold" : ""}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
