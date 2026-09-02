"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { REGION_LABELS_TR, type ProfileRow } from "@/lib/roles";

export type TeamMemberStats = {
  poolCount: number;
  openLeadCount: number;
  pipelineText: string;
  activeCustomerCount: number;
  proposalsSentCount: number;
  proposalsWonText: string;
};

export function TeamTable({
  members,
  stats,
}: {
  members: ProfileRow[];
  stats: Record<string, TeamMemberStats>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse">
          <thead>
            <tr className="bg-rg-surface-alt text-left">
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Üye
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Bölge
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Havuz
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Açık Lead
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Pipeline
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Aktif Müşteri
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Gönderilen Teklif
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Durum
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const s = stats[m.id];
              return (
                <tr key={m.id} className="border-t border-rg-line">
                  <td className="px-4 py-3">
                    <div className="text-[12.8px] font-semibold text-rg-ink">
                      {m.full_name || "(isim girilmemiş)"}
                    </div>
                    <div className="text-[11.5px] text-rg-ink-faint">{m.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                    {m.region ? REGION_LABELS_TR[m.region] : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                    {s?.poolCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                    {s?.openLeadCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{s?.pipelineText ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                    {s?.activeCustomerCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                    {s?.proposalsSentCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold " +
                        (m.is_active ? "bg-gofactory-tint text-gofactory" : "bg-rg-surface-alt text-rg-ink-faint")
                      }
                    >
                      {m.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/sales/team/${m.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                    >
                      Detay
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                  Henüz satış ekibinde üye yok — Kullanıcı & Yetki ekranından &quot;Satış Ekibi&quot; rolüyle
                  davet edebilirsin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
