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
  Building2,
  Contact,
  TrendingUp,
  Megaphone,
  Receipt,
  KeyRound,
  LifeBuoy,
  Inbox,
  UserCog,
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
    label: "Şirketler & Kişiler",
    items: [
      { label: "Şirketler", href: "/companies", icon: Building2, phase: "beta" },
      { label: "Kişiler", href: "/contacts", icon: Contact, phase: "beta" },
    ],
  },
  {
    label: "Satış",
    items: [
      { label: "Performansım", href: "/sales/performance", icon: TrendingUp, phase: "beta" },
      { label: "Satış Ekibi", href: "/sales/team", icon: UserCog, phase: "beta" },
      { label: "Müşteri Havuzu", href: "/sales", icon: Users, phase: "beta" },
      { label: "Müşteri Adayları", href: "/sales/leads", icon: FileText, phase: "beta" },
      { label: "Müşteriler", href: "/sales/customers", icon: Users, phase: "beta" },
      { label: "Lisanslar", href: "/licenses", icon: KeyRound, phase: "beta" },
      { label: "Destek Merkezi", href: "/support", icon: LifeBuoy, phase: "beta" },
      { label: "Müşteri Talepleri", href: "/customer-requests", icon: Inbox, phase: "beta" },
      {
        label: "Teklifler",
        href: "/sales/proposals",
        icon: FileText,
        phase: "beta",
      },
      {
        label: "Teklif Oluştur",
        href: "/sales/proposals/new",
        icon: FileText,
        phase: "beta",
      },
      {
        label: "Teklif Şablonları",
        href: "/sales/proposal-templates",
        icon: BookOpen,
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
    label: "Pazarlama",
    items: [{ label: "Kampanyalar", href: "/marketing", icon: Megaphone, phase: "beta" }],
  },
  {
    label: "Finans",
    items: [{ label: "Faturalar", href: "/finance", icon: Receipt, phase: "beta" }],
  },
  {
    label: "Yönetim",
    items: [
      { label: "Ürün Geliştirme", href: "/roadmap", icon: Milestone, phase: "v1" },
      { label: "Kullanıcı & Yetki", href: "/users", icon: ShieldCheck, phase: "beta" },
    ],
  },
];
