"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-rg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-rg-line bg-rg-surface p-8 shadow-rg">
        <div className="mb-6 text-center">
          <div className="font-display text-lg font-bold text-rg-ink">
            Respongo <span className="text-primary">CRM</span>
          </div>
          <p className="mt-1 text-[13px] text-rg-ink-soft">
            E-posta adresinle giriş bağlantısı al.
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-lg bg-golms-tint px-4 py-3 text-center text-[13px] font-medium text-golms">
            Giriş bağlantısı <b>{email}</b> adresine gönderildi. Gelen kutunu
            (ve gerekirse spam klasörünü) kontrol et.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="isim@respongo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border border-rg-line bg-white px-3.5 py-2.5 text-[13.5px] text-rg-ink outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-[10px] bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {status === "loading" ? "Gönderiliyor..." : "Giriş Bağlantısı Gönder"}
            </button>
            {status === "error" && (
              <p className="text-center text-[12px] text-destructive">
                {errorMsg || "Bir şeyler ters gitti, tekrar dene."}
              </p>
            )}
          </form>
        )}
      </div>
      <p className="text-[11.5px] text-rg-ink-faint">
        Hesabın yoksa Süper Admin'in seni davet etmesi gerekiyor.
      </p>
    </main>
  );
}
