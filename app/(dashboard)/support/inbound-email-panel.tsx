"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Check, X, Loader2 } from "lucide-react";
import { convertInboundEmailToTicket, ignoreInboundEmail } from "./actions";
import type { CustomerOption } from "./ticket-form";

export type UnmatchedInboundEmail = {
  id: string;
  from_address: string;
  from_name: string | null;
  subject: string | null;
  body_text: string | null;
  region: "tr" | "global";
  received_at: string;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function InboundRow({ email, customers }: { email: UnmatchedInboundEmail; customers: CustomerOption[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function convert() {
    if (!customerId) {
      setError("Önce bir müşteri seç.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await convertInboundEmailToTicket(email.id, customerId);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function ignore() {
    setError("");
    startTransition(async () => {
      const result = await ignoreInboundEmail(email.id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-rg-line bg-rg-surface-alt p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-rg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-rg-ink-faint">
            {email.region === "tr" ? "destek@" : "support@"}
          </span>
          <span className="truncate text-[12.5px] font-semibold text-rg-ink">
            {email.from_name ? `${email.from_name} · ` : ""}
            {email.from_address}
          </span>
          <span className="text-[11px] text-rg-ink-faint">{fmtDateTime(email.received_at)}</span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-rg-ink-soft">{email.subject || "(konu yok)"}</p>
        {email.body_text && <p className="mt-0.5 line-clamp-1 text-[11px] text-rg-ink-faint">{email.body_text}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="rounded-lg border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
        >
          <option value="">Müşteri seç…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={convert}
          title="Talep oluştur"
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Talep Oluştur
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={ignore}
          title="Yoksay"
          className="grid h-8 w-8 place-items-center rounded-lg border border-rg-line text-rg-ink-faint hover:border-destructive hover:text-destructive disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="basis-full text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

/** Kullanıcının isteği: "destek@respongo.com müşteri mail atınca direkt buraya düşmesi lazım
 * support@respongo.com aynı şekilde". Gelen e-posta sistemde kayıtlı bir müşteriyle otomatik
 * eşleşmediyse (bkz. app/api/webhooks/inbound-email) burada bekler — destek ekibi tek tıkla
 * doğru müşteriyi seçip talebe dönüştürür ya da yoksayar (spam, alakasız e-posta vb.). */
export function InboundEmailPanel({ emails, customers }: { emails: UnmatchedInboundEmail[]; customers: CustomerOption[] }) {
  if (emails.length === 0) return null;
  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4 text-amber-700" />
        <h3 className="text-[13px] font-bold text-amber-900">
          Eşleşmeyen Gelen E-postalar ({emails.length})
        </h3>
      </div>
      <p className="mb-3 text-[11.5px] text-amber-800/80">
        destek@ / support@respongo.com&apos;a gelen bu e-postaların göndereni sistemde kayıtlı bir müşteriyle otomatik eşleşmedi — bir
        müşteri seçip talebe dönüştür, ya da alakasızsa yoksay.
      </p>
      <div className="flex flex-col gap-2">
        {emails.map((email) => (
          <InboundRow key={email.id} email={email} customers={customers} />
        ))}
      </div>
    </div>
  );
}
