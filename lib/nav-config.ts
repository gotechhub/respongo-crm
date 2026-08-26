import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  FolderKanban,
  CalendarClock,
  Milestone,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** beta = kurulu, live route. v1 = spec'te var ama bu fazda pasif (rota yok). */
  phase: "beta" | "v1";
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Genel",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, phase: "beta" },
    ],
  },
  {
    label: "Satış",
    items: [
      { label: "Müşteri Havuzu", href: "/sales", icon: Users, phase: "beta" },
      {
        label: "Teklif Oluştur",
        href: "/sales/proposals/new",
        icon: FileText,
        phase: "beta",
      },
      {
        label: "Fiyat Listeleri",
        href: "/sales/price-lists",
        icon: Wallet,
        phase: "beta",
      },
      { label: "Kaynaklar", href: "/sales/resources", icon: BookOpen, phase: "v1" },
    ],
  },
  {
    label: "Operasyon",
    items: [
      { label: "Proje & Görev", href: "/projects", icon: FolderKanban, phase: "beta" },
      { label: "Takvim / Planner", href: "/planner", icon: CalendarClock, phase: "v1" },
    ],
  },
  {
    label: "Yönetim",
    items: [
      { label: "Ürün Geliştirme", href: "/roadmap", icon: Milestone, phase: "v1" },
      { label: "Kullanıcı & Yetki", href: "/users", icon: ShieldCheck, phase: "beta" },
    ],
  },
];
