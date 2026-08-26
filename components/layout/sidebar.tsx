"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups } from "@/lib/nav-config";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS_TR, REGION_LABELS_TR, type ProfileRow } from "@/lib/roles";
import { ThemeToggle } from "@/components/theme-toggle";

const ecoDots = [
  { key: "golms", className: "bg-golms" },
  { key: "golxp", className: "bg-golxp" },
  { key: "gocatalog", className: "bg-gocatalog-raw" },
  { key: "gofactory", className: "bg-gofactory-raw" },
  { key: "gotools", className: "bg-gotools-raw" },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Sidebar({ profile }: { profile: ProfileRow }) {
  const pathname = usePathname();
  const router = useRouter();

  const displayName = profile.full_name || profile.email;
  const roleLabel = profile.role ? ROLE_LABELS_TR[profile.role] : "Rol atanmadı";
  const regionLabel = profile.region ? ` · ${REGION_LABELS_TR[profile.region]}` : "";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[252px] flex-col bg-gradient-to-br from-sidebar-from via-sidebar-via to-sidebar-to px-4 pb-4 pt-6 text-sidebar-fg">
      <div className="px-1.5 pb-4">
        <Image
          src="/logos/respongo-white.avif"
          alt="Respongo"
          width={288}
          height={110}
          priority
          className="h-8 w-auto"
        />
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-sidebar-fg-faint">
          CRM · Beta
        </div>
      </div>

      <div
        className="flex gap-1.5 px-1.5 pb-5"
        title="GOLMS · GOLXP · GOCATALOG · GOFACTORY · GOTOOLS"
      >
        {ecoDots.map((d) => (
          <div key={d.key} className={cn("h-1 flex-1 rounded-[3px]", d.className)} />
        ))}
      </div>

      <nav className="flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.9px] text-sidebar-fg-label">
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;

              if (item.phase === "v1") {
                return (
                  <div
                    key={item.href}
                    className="mb-0.5 flex cursor-not-allowed items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.1px] font-medium text-sidebar-fg-faint/60"
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-60" />
                    {item.label}
                    <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold">
                      V1
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mb-0.5 flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.1px] font-medium text-sidebar-fg-muted transition-colors hover:bg-white/[.06]",
                    active && "bg-primary text-white"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 opacity-80", active && "opacity-100")} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-white/[.12] px-1.5 py-0.5 text-[10px] font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/[.08] pt-3.5">
        <div className="flex items-center gap-2.5 p-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-golxp to-golms font-display text-xs font-bold text-white">
            {initialsOf(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold text-white">
              {displayName}
            </div>
            <div className="truncate text-[10.5px] text-sidebar-fg-faint">
              {roleLabel}
              {regionLabel}
            </div>
          </div>
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            title="Çıkış yap"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-sidebar-fg-faint transition-colors hover:bg-white/[.08] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
