"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Plus, Trash2, UserRound } from "lucide-react";
import { inviteCustomerPortalUser, removeCustomerPortalUser } from "../actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export type PortalUserRow = { profileId: string; fullName: string | null; email: string };

// Müşteri Portalı erişim yönetimi — sadece kurucu veya bu müşterinin sahibi
// olan satışçı görebilir (page.tsx'te canManage ile kontrol edilip render
// edilmiyorsa bu bileşen hiç mount edilmiyor).
export function PortalAccessPanel({
  customerId,
  initialUsers,
}: {
  customerId: string;
  initialUsers: PortalUserRow[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await inviteCustomerPortalUser(customerId, email, fullName);
      if (result.ok) {
        setEmail("");
        setFullName("");
        setFormOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemove(profileId: string) {
    if (!confirm("Bu kullanıcının portal erişimini kaldırmak istediğine emin misin?")) return;
    setError("");
    startTransition(async () => {
      const result = await removeCustomerPortalUser(profileId, customerId);
      if (result.ok) {
        setUsers((u) => u.filter((x) => x.profileId !== profileId));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-rg-ink-faint" />
        <div className="text-[13px] font-bold text-rg-ink">Müşteri Portalı Erişimi</div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[12px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt"
        >
          <Plus className="h-3.5 w-3.5" />
          Portal Kullanıcısı Davet Et
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleInvite} className="mb-4 grid grid-cols-2 gap-3 rounded-[10px] bg-rg-surface-alt p-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ad Soyad</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>E-posta *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Davet Gönder
            </button>
            <p className="mt-2 text-[11.5px] text-rg-ink-faint">
              Bu e-postaya giriş bağlantısı gönderilir; giriş yaptığında sadece bu müşterinin tekliflerini
              görebilir.
            </p>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <p className="text-[12px] text-rg-ink-faint">Bu müşterinin henüz portal erişimi olan kullanıcısı yok.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.profileId}
              className="flex items-center gap-2.5 rounded-[8px] border border-rg-line px-3 py-2"
            >
              <UserRound className="h-3.5 w-3.5 shrink-0 text-rg-ink-faint" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-rg-ink">{u.fullName || u.email}</div>
                {u.fullName && <div className="truncate text-[11px] text-rg-ink-faint">{u.email}</div>}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(u.profileId)}
                disabled={isPending}
                title="Erişimi kaldır"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-rg-ink-faint transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
