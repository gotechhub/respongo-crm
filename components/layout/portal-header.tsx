"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

// Müşteri Portalı için ayrı, sade bir üst bar — iç CRM'in Sidebar'ından
// bilinçli olarak farklı: satış/pazarlama/finans navigasyonu yok, sadece
// müşterinin kendi şirket adı + çıkış. Respongo'nun renkli (açık zemin)
// logosu kullanılıyor, sidebar'daki beyaz varyant değil.
export function PortalHeader({ companyName }: { companyName: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-rg-line bg-rg-surface px-6 py-4">
      <div className="flex items-center gap-3">
        <Image src="/logos/respongo-color.avif" alt="Respongo" width={288} height={110} priority className="h-7 w-auto" />
        <div className="h-6 w-px bg-rg-line" />
        <div className="text-[13px] font-semibold text-rg-ink">{companyName}</div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/portal"
          className="rounded-[8px] px-3 py-1.5 text-[12.5px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-surface-alt"
        >
          Tekliflerim
        </Link>
        <button
          onClick={handleSignOut}
          title="Çıkış yap"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-rg-ink-faint transition-colors hover:bg-rg-surface-alt hover:text-rg-ink"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
