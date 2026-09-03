import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  FolderKanban,
  ListTodo,
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
  Handshake,
  Settings,
  CalendarDays,
  UserSquare2,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** beta = kurulu, live route. v1 = spec'te var ama bu fazda pasif (rota yok). */
  phase: "beta" | "v1";
};

/**
 * Bir grup içinde isteğe bağlı alt-gruplama (küçük başlıklı bölüm). `label`
 * verilmezse başlıksız, sade bir alt-liste olarak render edilir (ör. tek
 * öğeli gruplarda). DERS 39/40 (2026-09-03, V3 IA yenilemesi): önceki sürümde
 * "Satış" grubunun altında 13 öğe DÜZ liste halindeydi — bu hem görsel
 * kalabalık YARATIYORDU hem de kullanıcının "müşteriler + müşteri adayları +
 * müşteri havuzu birlikte gruplanmalı" isteğiyle birebir çelişiyordu. Yeni
 * yapı: Ana kategori (ikon+başlık) → alt-bölüm (küçük başlık) → öğe.
 */
export type NavSubgroup = {
  label?: string;
  items: NavItem[];
};

export type NavGroup = {
  label: string;
  /** Ana kategori ikonu — sidebar'da grup başlığının solunda gösterilir. */
  icon: LucideIcon;
  subgroups: NavSubgroup[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Genel",
    icon: LayoutDashboard,
    subgroups: [
      {
        items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, phase: "beta" }],
      },
    ],
  },
  {
    label: "Şirketler & Kişiler",
    icon: Building2,
    subgroups: [
      {
        items: [
          { label: "Şirketler", href: "/companies", icon: Building2, phase: "beta" },
          { label: "Kişiler", href: "/contacts", icon: Contact, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Satış",
    icon: TrendingUp,
    subgroups: [
      {
        label: "Müşteriler",
        items: [
          { label: "Müşteri Havuzu", href: "/sales", icon: Users, phase: "beta" },
          { label: "Müşteri Adayları", href: "/sales/leads", icon: FileText, phase: "beta" },
          { label: "Müşteriler", href: "/sales/customers", icon: UserSquare2, phase: "beta" },
          { label: "Lisanslar", href: "/licenses", icon: KeyRound, phase: "beta" },
        ],
      },
      {
        label: "Teklifler",
        items: [
          { label: "Teklifler", href: "/sales/proposals", icon: FileText, phase: "beta" },
          { label: "Teklif Oluştur", href: "/sales/proposals/new", icon: FileText, phase: "beta" },
          { label: "Teklif Şablonları", href: "/sales/proposal-templates", icon: BookOpen, phase: "beta" },
          { label: "Fiyat Listeleri", href: "/sales/price-lists", icon: Wallet, phase: "beta" },
        ],
      },
      {
        label: "Ekip & Kaynaklar",
        items: [
          { label: "Performansım", href: "/sales/performance", icon: TrendingUp, phase: "beta" },
          { label: "Satış Ekibi", href: "/sales/team", icon: UserCog, phase: "beta" },
          { label: "Kaynaklar", href: "/sales/resources", icon: BookOpen, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Destek",
    icon: LifeBuoy,
    subgroups: [
      {
        items: [
          { label: "Destek Merkezi", href: "/support", icon: LifeBuoy, phase: "beta" },
          { label: "Müşteri Talepleri", href: "/customer-requests", icon: Inbox, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "İş Ortakları",
    icon: Handshake,
    subgroups: [
      {
        items: [
          { label: "İş Ortağı Panelim", href: "/partner", icon: Handshake, phase: "beta" },
          { label: "İş Ortakları", href: "/partner-admin", icon: UserCog, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Proje & Görev",
    icon: FolderKanban,
    subgroups: [
      {
        items: [
          { label: "Projeler", href: "/projects", icon: FolderKanban, phase: "beta" },
          { label: "Görevlerim", href: "/tasks", icon: ListTodo, phase: "beta" },
          { label: "Takvim / Planner", href: "/planner", icon: CalendarClock, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Pazarlama",
    icon: Megaphone,
    subgroups: [
      {
        items: [
          { label: "Kampanyalar", href: "/marketing", icon: Megaphone, phase: "beta" },
          { label: "İçerik Takvimi", href: "/marketing/calendar", icon: CalendarDays, phase: "beta" },
          { label: "Pazarlama Ayarları", href: "/marketing/settings", icon: Settings, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Finans",
    icon: Receipt,
    subgroups: [
      {
        items: [
          { label: "Faturalar", href: "/finance", icon: Receipt, phase: "beta" },
          { label: "Fatura Ayarları", href: "/finance/settings", icon: Settings, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Yönetim",
    icon: ShieldCheck,
    subgroups: [
      {
        label: "Kullanıcılar",
        items: [
          { label: "Kullanıcı & Yetki", href: "/users", icon: ShieldCheck, phase: "beta" },
          { label: "Test Hesapları", href: "/test-accounts", icon: UserCog, phase: "beta" },
        ],
      },
      {
        label: "Sistem",
        items: [{ label: "Sistem Ayarları", href: "/system-settings", icon: Settings, phase: "beta" }],
      },
      {
        label: "Yol Haritası",
        items: [{ label: "Ürün Geliştirme", href: "/roadmap", icon: Milestone, phase: "v1" }],
      },
    ],
  },
];

/** Sidebar'ın tüm öğelerini (grup/alt-grup ayrımı olmadan) tek düz liste olarak döner. */
export function flattenNavItems(): NavItem[] {
  return navGroups.flatMap((g) => g.subgroups.flatMap((sg) => sg.items));
}

/**
 * Verilen pathname için EN UZUN (en spesifik) eşleşen href'i döner — sidebar
 * bunu kullanarak SADECE bir öğeyi aktif işaretler. Önceki sürümde her öğe
 * bağımsız olarak `pathname.startsWith(item.href)` kontrolü yapıyordu; bu,
 * "/sales" gibi kısa bir href'in "/sales/leads", "/sales/customers" vb. HER
 * alt sayfada da aktif görünmesine yol açıyordu — yani kullanıcının "sol
 * tarafta çıkan kötü çubuk" olarak tarif ettiği, gerçek aktif öğenin YANINDA
 * fazladan bir mavi vurgulanmış satırın belirmesi sorunu buydu. Artık tek bir
 * "en spesifik eşleşme" hesaplanıyor.
 */
export function resolveActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const item of flattenNavItems()) {
    const matches = pathname === item.href || pathname.startsWith(item.href + "/");
    if (matches && (best === null || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}
