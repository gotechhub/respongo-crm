"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { changePassword } from "@/lib/profile/actions";

const inputClass =
  "w-full rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function handleSave() {
    setMessage(null);
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Şifre en az 8 karakter olmalı." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Şifreler eşleşmiyor." });
      return;
    }
    startTransition(async () => {
      const result = await changePassword(newPassword);
      if (result.ok) {
        setNewPassword("");
        setConfirmPassword("");
        setMessage({ type: "ok", text: "Şifren güncellendi." });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">Yeni Şifre</span>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="En az 8 karakter"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">Şifre (Tekrar)</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      <div className="flex items-center gap-2.5 sm:col-span-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !newPassword || !confirmPassword}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3.5 py-2 text-[12.2px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Şifreyi Güncelle
        </button>
        {message && (
          <span className={`text-[11.8px] font-medium ${message.type === "ok" ? "text-golxp" : "text-destructive"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
