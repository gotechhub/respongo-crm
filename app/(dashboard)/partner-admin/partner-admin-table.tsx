"use client";

import { Fragment, useState, useTransition, type FormEvent } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { updatePartnerAdmin, createPartnerWithProfile, removePartner } from "./actions";

export type PartnerAdminRow = {
  partnerProfileId: string;
  profileId: string;
  fullName: string | null;
  email: string;
  region: Region | null;
  companyName: string | null;
  taxNo: string | null;
  website: string | null;
  country: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  iban: string | null;
  swift: string | null;
  onboardingStep: number;
  onboardingCompleted: boolean;
  commissionRate: number | null;
  status: "pending_review" | "active" | "suspended";
  adminNote: string | null;
};

const STATUS_OPTIONS: PartnerAdminRow["status"][] = ["pending_review", "active", "suspended"];
const STATUS_LABEL: Record<PartnerAdminRow["status"], string> = {
  pending_review: "Onay Bekliyor",
  active: "Aktif",
  suspended: "Askıya Alındı",
};

const inputClass =
  "w-full rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[10.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

function Row({ row }: { row: PartnerAdminRow }) {
  const [expanded, setExpanded] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [commissionRate, setCommissionRate] = useState(row.commissionRate?.toString() ?? "");
  const [status, setStatus] = useState(row.status);
  const [adminNote, setAdminNote] = useState(row.adminNote ?? "");
  const [companyName, setCompanyName] = useState(row.companyName ?? "");
  const [taxNo, setTaxNo] = useState(row.taxNo ?? "");
  const [website, setWebsite] = useState(row.website ?? "");
  const [country, setCountry] = useState(row.country ?? "");
  const [address, setAddress] = useState(row.address ?? "");
  const [bankName, setBankName] = useState(row.bankName ?? "");
  const [bankAccountName, setBankAccountName] = useState(row.bankAccountName ?? "");
  const [iban, setIban] = useState(row.iban ?? "");
  const [swift, setSwift] = useState(row.swift ?? "");

  const [isPending, startTransition] = useTransition();
  const [removePending, startRemove] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [removeError, setRemoveError] = useState("");

  function handleSave() {
    setError("");
    startTransition(async () => {
      const parsed = commissionRate.trim() === "" ? null : Number(commissionRate);
      if (parsed !== null && (Number.isNaN(parsed) || parsed < 0 || parsed > 100)) {
        setError("Komisyon oranı 0-100 arasında bir sayı olmalı.");
        return;
      }
      const result = await updatePartnerAdmin(row.partnerProfileId, {
        commissionRate: parsed,
        status,
        adminNote,
        companyName,
        taxNo,
        website,
        country,
        address,
        bankName,
        bankAccountName,
        iban,
        swift,
      });
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemove() {
    setRemoveError("");
    startRemove(async () => {
      const result = await removePartner(row.partnerProfileId, row.profileId);
      if (!result.ok) {
        setRemoveError(result.error);
      }
      setRemoving(false);
    });
  }

  return (
    <Fragment>
      <tr className="border-t border-rg-line align-top">
        <td className="px-4 py-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-left hover:text-primary"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
            <span>
              <div className="text-[12.8px] font-semibold text-rg-ink">{row.fullName || "(isim girilmemiş)"}</div>
              <div className="text-[11.5px] text-rg-ink-faint">{row.email}</div>
            </span>
          </button>
        </td>
        <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
          <div>{row.companyName || "—"}</div>
          <div className="text-[11px] text-rg-ink-faint">{row.country || "—"}</div>
        </td>
        <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
          {row.onboardingCompleted ? "Tamamlandı" : `Adım ${row.onboardingStep}/5`}
        </td>
        <td className="px-4 py-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PartnerAdminRow["status"])}
            className="rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <input
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="—"
              className="w-16 rounded-[8px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
            />
            <span className="text-[12px] text-rg-ink-faint">%</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <input
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="İç not..."
            className="w-full min-w-[160px] rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
          />
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
              {saved ? "Kaydedildi" : "Kaydet"}
            </button>
            {row.status !== "suspended" && (
              <button
                onClick={() => setRemoving((v) => !v)}
                title="Kaldır"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-rg-ink-soft hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {error && <div className="mt-1 max-w-[180px] text-[11px] text-destructive">{error}</div>}
        </td>
      </tr>

      {removing && (
        <tr className="border-t border-rg-line bg-destructive/5">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-rg-ink">
              <span>
                <span className="font-semibold">{row.fullName || row.email}</span> iş ortaklığından kaldırılacak
                (hesap pasifleşir, giriş yapamaz, durumu &quot;Askıya Alındı&quot; olur — komisyon geçmişi bozulmadan
                kalır).
              </span>
              <button
                onClick={handleRemove}
                disabled={removePending}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-destructive px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
              >
                {removePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Kaldır
              </button>
              <button
                onClick={() => setRemoving(false)}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3.5 py-1.5 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-surface-alt"
              >
                Vazgeç
              </button>
              {removeError && <span className="text-[12px] text-destructive">{removeError}</span>}
            </div>
          </td>
        </tr>
      )}

      {expanded && (
        <tr className="border-t border-rg-line bg-rg-surface-alt/60">
          <td colSpan={7} className="px-4 py-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              Firma &amp; Banka Bilgileri
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Firma Adı</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Vergi No</label>
                <input value={taxNo} onChange={(e) => setTaxNo(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Web Sitesi</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Ülke</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className={labelClass}>Adres</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Banka Adı</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Hesap Sahibi</label>
                <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>IBAN</label>
                <input value={iban} onChange={(e) => setIban(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>SWIFT</label>
                <input value={swift} onChange={(e) => setSwift(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Firma &amp; Banka Bilgilerini Kaydet
              </button>
              {error && <span className="text-[12px] text-destructive">{error}</span>}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function AddPartnerForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState<Region>("tr");
  const [companyName, setCompanyName] = useState("");
  const [taxNo, setTaxNo] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [status, setStatus] = useState<PartnerAdminRow["status"]>("active");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const parsedCommission = commissionRate.trim() === "" ? null : Number(commissionRate);
      const result = await createPartnerWithProfile({
        email,
        fullName,
        region,
        companyName,
        taxNo,
        website,
        country,
        address,
        bankName,
        bankAccountName,
        iban,
        swift,
        commissionRate: parsedCommission,
        status,
      });
      if (result.ok) {
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3 text-[12.5px] text-rg-ink-faint">
        Hesap davet edilir (Supabase Auth üzerinden) ve firma/banka bilgileri bir arada oluşturulur — partnerin
        kendisi sadece iş ortaklığı şartlarını onaylamak için giriş yapması yeterli olur.
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Ad Soyad *</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>E-posta *</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Bölge *</label>
          <select value={region} onChange={(e) => setRegion(e.target.value as Region)} className={inputClass}>
            <option value="tr">{REGION_LABELS_TR.tr}</option>
            <option value="global">{REGION_LABELS_TR.global}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Durum</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as PartnerAdminRow["status"])} className={inputClass}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Firma Adı *</label>
          <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Vergi No</label>
          <input value={taxNo} onChange={(e) => setTaxNo(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Web Sitesi</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Ülke</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelClass}>Adres</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Komisyon Oranı</label>
          <div className="flex items-center gap-1">
            <input value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className={inputClass} />
            <span className="text-[12px] text-rg-ink-faint">%</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Banka Adı</label>
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Hesap Sahibi</label>
          <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>IBAN</label>
          <input value={iban} onChange={(e) => setIban(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>SWIFT</label>
          <input value={swift} onChange={(e) => setSwift(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          İş Ortağını Oluştur
        </button>
        {error && <span className="text-[12px] text-destructive">{error}</span>}
      </div>
    </form>
  );
}

export function PartnerAdminTable({ rows }: { rows: PartnerAdminRow[] }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showAdd ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showAdd ? "Vazgeç" : "Yeni İş Ortağı Ekle"}
        </button>
      </div>

      {showAdd && <AddPartnerForm onDone={() => setShowAdd(false)} />}

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Ortak</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Firma</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Kayıt</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Komisyon</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">İç Not</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Row key={row.partnerProfileId} row={row} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    Henüz kayıtlı satış iş ortağı yok — yukarıdaki &quot;Yeni İş Ortağı Ekle&quot; ile
                    oluşturabilirsin.
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
