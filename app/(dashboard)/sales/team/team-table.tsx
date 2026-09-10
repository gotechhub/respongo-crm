"use client";

import { Fragment, useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Pencil, Trash2, UserPlus, X, Check, AlertTriangle } from "lucide-react";
import { REGION_LABELS_TR, type ProfileRow, type Region } from "@/lib/roles";
import { inviteSalesTeamMember, updateTeamMemberProfile, removeTeamMember, getTeamMemberOpenWorkload } from "./actions";

export type TeamMemberStats = {
  poolCount: number;
  openLeadCount: number;
  pipelineText: string;
  activeCustomerCount: number;
  proposalsSentCount: number;
  proposalsWonText: string;
};

function RegionSelect({
  value,
  onChange,
  lockedTo,
}: {
  value: Region | "";
  onChange: (v: Region | "") => void;
  lockedTo: Region | null;
}) {
  const options: Region[] = lockedTo ? [lockedTo] : ["tr", "global"];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Region | "")}
      className="rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12.5px] text-rg-ink outline-none focus:border-primary"
    >
      <option value="" disabled>
        Bölge seç
      </option>
      {options.map((r) => (
        <option key={r} value={r}>
          {REGION_LABELS_TR[r]}
        </option>
      ))}
    </select>
  );
}

// --- Satırın içinde açılan "Düzenle" formu ---
function EditRow({ member, onClose }: { member: ProfileRow; onClose: () => void }) {
  const [fullName, setFullName] = useState(member.full_name ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [region, setRegion] = useState<Region | "">(member.region ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateTeamMemberProfile(member.id, fullName, phone, region === "" ? null : region);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <tr className="border-t border-rg-line bg-rg-surface-alt/60">
      <td colSpan={9} className="px-4 py-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Ad Soyad</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-56 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Telefon</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5xx xxx xx xx"
              className="w-44 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Bölge</label>
            <RegionSelect value={region} onChange={setRegion} lockedTo={null} />
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Kaydet
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3.5 py-2 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-surface-alt"
          >
            Vazgeç
          </button>
          {error && <span className="text-[12px] text-destructive">{error}</span>}
        </div>
      </td>
    </tr>
  );
}

// --- Satırın içinde açılan "Kaldır" onay/devir formu ---
function RemoveRow({
  member,
  otherMembers,
  onClose,
}: {
  member: ProfileRow;
  otherMembers: ProfileRow[];
  onClose: () => void;
}) {
  const [loadingWorkload, setLoadingWorkload] = useState(true);
  const [hasOpenWork, setHasOpenWork] = useState(false);
  const [workloadSummary, setWorkloadSummary] = useState("");
  const [reassignTo, setReassignTo] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTeamMemberOpenWorkload(member.id).then((w) => {
      if (cancelled) return;
      const parts: string[] = [];
      if (w.poolCount > 0) parts.push(`${w.poolCount} havuz kaydı`);
      if (w.openLeadCount > 0) parts.push(`${w.openLeadCount} açık lead`);
      if (w.activeCustomerCount > 0) parts.push(`${w.activeCustomerCount} aktif müşteri`);
      if (w.openProposalCount > 0) parts.push(`${w.openProposalCount} taslak/gönderilmiş teklif`);
      setHasOpenWork(parts.length > 0);
      setWorkloadSummary(parts.join(", "));
      setLoadingWorkload(false);
    });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  function handleRemove() {
    setError("");
    if (hasOpenWork && !reassignTo) {
      setError("Devam eden işleri devredeceğin bir ekip üyesi seçmen gerekiyor.");
      return;
    }
    startTransition(async () => {
      const result = await removeTeamMember(member.id, reassignTo || null);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <tr className="border-t border-rg-line bg-destructive/5">
      <td colSpan={9} className="px-4 py-4">
        {loadingWorkload ? (
          <div className="flex items-center gap-2 text-[12.5px] text-rg-ink-faint">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Devam eden işler kontrol ediliyor…
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 text-[12.5px] text-rg-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <span className="font-semibold">{member.full_name || member.email}</span> ekipten kaldırılacak
                (hesabı pasifleşir, giriş yapamaz — geçmiş kayıtları bozulmadan kalır).
                {hasOpenWork ? (
                  <> Devam eden işleri var: <span className="font-semibold">{workloadSummary}</span> — bunları
                  kaldırmadan önce başka bir ekip üyesine devretmen gerekiyor.</>
                ) : (
                  <> Devam eden açık işi yok, doğrudan kaldırılabilir.</>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {hasOpenWork && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
                    Devredilecek Ekip Üyesi
                  </label>
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-64 rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-2 text-[12.5px] text-rg-ink outline-none focus:border-primary"
                  >
                    <option value="">Seç…</option>
                    {otherMembers
                      .filter((m) => m.is_active)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name || m.email}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-destructive px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Kaldır
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3.5 py-2 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-surface-alt"
              >
                Vazgeç
              </button>
              {error && <span className="text-[12px] text-destructive">{error}</span>}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

export function TeamTable({
  members,
  stats,
  canManageAllRegions,
  callerRegion,
}: {
  members: ProfileRow[];
  stats: Record<string, TeamMemberStats>;
  canManageAllRegions: boolean;
  callerRegion: Region | null;
}) {
  const [rowMode, setRowMode] = useState<{ id: string; mode: "edit" | "remove" } | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRegion, setInviteRegion] = useState<Region | "">(canManageAllRegions ? "" : callerRegion ?? "");
  const [invitePending, startInvite] = useTransition();
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError("");
    startInvite(async () => {
      const result = await inviteSalesTeamMember(inviteEmail, inviteName, inviteRegion === "" ? null : inviteRegion);
      if (result.ok) {
        setInviteSent(true);
        setInviteEmail("");
        setInviteName("");
        setTimeout(() => {
          setShowInvite(false);
          setInviteSent(false);
        }, 1500);
      } else {
        setInviteError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowInvite((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showInvite ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showInvite ? "Vazgeç" : "Yeni Ekip Üyesi Ekle"}
        </button>
      </div>

      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="grid grid-cols-3 items-end gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Ad Soyad</label>
            <input
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Ayşe Yılmaz"
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">E-posta</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="ayse@respongo.com"
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Bölge</label>
            <RegionSelect
              value={inviteRegion}
              onChange={setInviteRegion}
              lockedTo={canManageAllRegions ? null : callerRegion}
            />
          </div>
          <div className="col-span-3 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={invitePending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {invitePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {inviteSent ? "Davet gönderildi" : "Daveti Gönder"}
            </button>
            {inviteError && <span className="text-[12px] text-destructive">{inviteError}</span>}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Üye</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Bölge</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Havuz</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Açık Lead</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Pipeline</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Aktif Müşteri</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Gönderilen Teklif</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const s = stats[m.id];
                const isExpanded = rowMode?.id === m.id;
                return (
                  <Fragment key={m.id}>
                    <tr className="border-t border-rg-line">
                      <td className="px-4 py-3">
                        <div className="text-[12.8px] font-semibold text-rg-ink">{m.full_name || "(isim girilmemiş)"}</div>
                        <div className="text-[11.5px] text-rg-ink-faint">{m.email}</div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{m.region ? REGION_LABELS_TR[m.region] : "—"}</td>
                      <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">{s?.poolCount ?? 0}</td>
                      <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">{s?.openLeadCount ?? 0}</td>
                      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{s?.pipelineText ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">{s?.activeCustomerCount ?? 0}</td>
                      <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">{s?.proposalsSentCount ?? 0}</td>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setRowMode(isExpanded && rowMode?.mode === "edit" ? null : { id: m.id, mode: "edit" })}
                            title="Düzenle"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {m.is_active && (
                            <button
                              onClick={() => setRowMode(isExpanded && rowMode?.mode === "remove" ? null : { id: m.id, mode: "remove" })}
                              title="Kaldır"
                              className="inline-flex items-center gap-1 text-[12px] font-semibold text-rg-ink-soft hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <Link
                            href={`/sales/team/${m.id}`}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                          >
                            Detay
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && rowMode?.mode === "edit" && (
                      <EditRow key={`${m.id}-edit`} member={m} onClose={() => setRowMode(null)} />
                    )}
                    {isExpanded && rowMode?.mode === "remove" && (
                      <RemoveRow
                        key={`${m.id}-remove`}
                        member={m}
                        otherMembers={members.filter((o) => o.id !== m.id)}
                        onClose={() => setRowMode(null)}
                      />
                    )}
                  </Fragment>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    Henüz satış ekibinde üye yok — yukarıdaki &quot;Yeni Ekip Üyesi Ekle&quot; ile davet edebilirsin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
