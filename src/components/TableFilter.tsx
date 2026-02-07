"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export type FilterOption = { label: string; value: string };
export type SortOption = { label: string; value: string };

interface TableFilterProps {
  searchPlaceholder?: string;
  filters?: { key: string; label: string; options: FilterOption[] }[];
  sorts?: SortOption[];
}

export default function TableFilter({ searchPlaceholder = "Pretraži...", filters = [], sorts = [] }: TableFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      {searchPlaceholder && (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(e) => {
              const timeout = setTimeout(() => updateParams("q", e.target.value), 300);
              return () => clearTimeout(timeout);
            }}
            className="input input-bordered input-sm w-full pl-9"
          />
        </div>
      )}

      {/* Filter dropdowns */}
      {filters.map((f) => (
        <select
          key={f.key}
          value={searchParams.get(f.key) ?? ""}
          onChange={(e) => updateParams(f.key, e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      {/* Sort */}
      {sorts.length > 0 && (
        <select
          value={searchParams.get("sort") ?? ""}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="">Sortiraj</option>
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}

      {/* Reset */}
      {searchParams.toString() && (
        <button
          onClick={() => router.push(pathname)}
          className="btn btn-ghost btn-sm text-base-content/50"
        >
          ✕ Resetuj
        </button>
      )}
    </div>
  );
}
