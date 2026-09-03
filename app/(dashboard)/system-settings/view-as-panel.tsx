"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, Search } from "lucide-react";
import { startViewAs } from "@/lib/view-as/actions";
import { ROLE_LABELS_TR, REGION_LABELS_TR, type ProfileRow } from "@/lib/roles";

export function ViewAsPanel({ candidates }: { candidates: ProfileRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        (c.full_name ?? "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.role ? ROLE_LABELS_TR[c.role].toLowerCase().includes(q) : false)
    );
  }, [candidates, query]);

  function handleViewAs(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await startViewAs(id);
      if (result.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.error);
        setPendingId(null);
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2">
        <Search className="h-3.5 w-3.5 text-rg-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim, e-posta veya rol ara..."
          className="w-full bg-transparent text-[12.8px] text-rg-ink outline-none"
        />
      </div>

      {error && (
        <div className="mb-3 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <table className="w-full min-w-[560px] border-collapse">
          <thead className="sticky top-0 bg-rg-surface-alt">
            <tr className="text-left">
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Kullanıcı</th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Rol</th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Bölge</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-rg-line/60">
                <td className="px-4 py-2.5">
                  <div className="text-[12.8px] font-semibold text-rg-ink">{c.full_name || "—"}</div>
                  <div className="text-[11px] text-rg-ink-faint">{c.email}</div>
                </td>
                <td className="px-4 py-2.5 text-[12.2px] text-rg-ink-soft">{c.role ? ROLE_LABELS_TR[c.role] : "—"}</td>
                <td className="px-4 py-2.5 text-[12.2px] text-rg-ink-soft">{c.region ? REGION_LABELS_TR[c.region] : "Global"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleViewAs(c.id)}
                    disabled={pendingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
                  >
                    {pendingId === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    Görüntüle
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                  Sonuç bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
