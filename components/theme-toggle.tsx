"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("rg-theme", next ? "dark" : "light");
    } catch {
      // localStorage kapalıysa sessizce yoksay — sadece kalıcılık kaybolur.
    }
  }

  // İlk render'da (isDark henüz bilinmiyorken) sabit bir simge göster —
  // hydration uyuşmazlığını önler, script zaten .dark sınıfını erkenden uyguladı.
  const showDark = isDark ?? false;

  return (
    <button
      onClick={toggle}
      title={showDark ? "Aydınlık moda geç" : "Karanlık moda geç"}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-sidebar-fg-faint transition-colors hover:bg-white/[.08] hover:text-white",
        className
      )}
    >
      {showDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
