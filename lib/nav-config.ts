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
  /** İngilizce karşılığı — sağ üstteki TR/EN anahtarı sidebar'da bunu kullanır. */
  labelEn: string;
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
  labelEn?: string;
  items: NavItem[];
};

export type NavGroup = {
  label: string;
  labelEn: string;
  /** Ana kategori ikonu — sidebar'da grup başlığının solunda gösterilir. */
  icon: LucideIcon;
  subgroups: NavSubgroup[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Genel",
    labelEn: "General",
    icon: LayoutDashboard,
    subgroups: [
      {
        items: [{ label: "Dashboard", labelEn: "Dashboard", href: "/dashboard", icon: LayoutDashboard, phase: "beta" }],
      },
    ],
  },
  {
    label: "Şirketler & Kişiler",
    labelEn: "Companies & Contacts",
    icon: Building2,
    subgroups: [
      {
        items: [
          { label: "Şirketler", labelEn: "Companies", href: "/companies", icon: Building2, phase: "beta" },
          { label: "Kişiler", labelEn: "Contacts", href: "/contacts", icon: Contact, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Satış",
    labelEn: "Sales",
    icon: TrendingUp,
    subgroups: [
      {
        label: "Müşteriler",
        labelEn: "Customers",
        items: [
          { label: "Müşteri Havuzu", labelEn: "Customer Pool", href: "/sales", icon: Users, phase: "beta" },
          { label: "Müşteri Adayları", labelEn: "Leads", href: "/sales/leads", icon: FileText, phase: "beta" },
          { label: "Müşteriler", labelEn: "Customers", href: "/sales/customers", icon: UserSquare2, phase: "beta" },
          { label: "Lisanslar", labelEn: "Licenses", href: "/licenses", icon: KeyRound, phase: "beta" },
        ],
      },
      {
        label: "Teklifler",
        labelEn: "Proposals",
        items: [
          { label: "Teklifler", labelEn: "Proposals", href: "/sales/proposals", icon: FileText, phase: "beta" },
          { label: "Teklif Oluştur", labelEn: "New Proposal", href: "/sales/proposals/new", icon: FileText, phase: "beta" },
          { label: "Teklif Şablonları", labelEn: "Proposal Templates", href: "/sales/proposal-templates", icon: BookOpen, phase: "beta" },
          { label: "Fiyat Listeleri", labelEn: "Price Lists", href: "/sales/price-lists", icon: Wallet, phase: "beta" },
          // DERS (2026-09-11): eskiden "Müşteri Talepleri" adıyla "Destek"
          // grubunda, "Destek Merkezi"nin YANINDA duruyordu — bu, iki farklı
          // KAVRAMI (arıza/destek talebi vs. satın alım/yenileme talebi) aynı
          // şemsiye altında gösterip kullanıcının "bunlar neden ayrı?" diye
          // sormasına yol açtı. Bu bir müşterinin TİCARİ isteğidir (yeni satın
          // alım, lisans yenileme, yeni ürün/proje/hizmet talebi) — destek
          // arızası değil — bu yüzden Teklifler'in yanına, adı netleştirilerek
          // taşındı.
          {
            label: "Satın Alım & Yenileme Talepleri",
            labelEn: "Purchase & Renewal Requests",
            href: "/customer-requests",
            icon: Inbox,
            phase: "beta",
          },
        ],
      },
      {
        label: "Ekip & Kaynaklar",
        labelEn: "Team & Resources",
        items: [
          { label: "Performansım", labelEn: "My Performance", href: "/sales/performance", icon: TrendingUp, phase: "beta" },
          { label: "Satış Ekibi", labelEn: "Sales Team", href: "/sales/team", icon: UserCog, phase: "beta" },
          { label: "Kaynaklar", labelEn: "Resources", href: "/sales/resources", icon: BookOpen, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Destek",
    labelEn: "Support",
    icon: LifeBuoy,
    subgroups: [
      {
        items: [{ label: "Destek Merkezi", labelEn: "Support Center", href: "/support", icon: LifeBuoy, phase: "beta" }],
      },
    ],
  },
  {
    label: "İş Ortakları",
    labelEn: "Partners",
    icon: Handshake,
    subgroups: [
      {
        items: [
          { label: "İş Ortağı Panelim", labelEn: "My Partner Panel", href: "/partner", icon: Handshake, phase: "beta" },
          { label: "İş Ortakları", labelEn: "Partners", href: "/partner-admin", icon: UserCog, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Proje & Görev",
    labelEn: "Projects & Tasks",
    icon: FolderKanban,
    subgroups: [
      {
        items: [
          { label: "Projeler", labelEn: "Projects", href: "/projects", icon: FolderKanban, phase: "beta" },
          { label: "Görevlerim", labelEn: "My Tasks", href: "/tasks", icon: ListTodo, phase: "beta" },
          { label: "Takvim / Planner", labelEn: "Calendar / Planner", href: "/planner", icon: CalendarClock, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Pazarlama",
    labelEn: "Marketing",
    icon: Megaphone,
    subgroups: [
      {
        items: [
          { label: "Kampanyalar", labelEn: "Campaigns", href: "/marketing", icon: Megaphone, phase: "beta" },
          { label: "İçerik Takvimi", labelEn: "Content Calendar", href: "/marketing/calendar", icon: CalendarDays, phase: "beta" },
          { label: "Pazarlama Ayarları", labelEn: "Marketing Settings", href: "/marketing/settings", icon: Settings, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Finans",
    labelEn: "Finance",
    icon: Receipt,
    subgroups: [
      {
        items: [
          { label: "Faturalar", labelEn: "Invoices", href: "/finance", icon: Receipt, phase: "beta" },
          { label: "Fatura Ayarları", labelEn: "Invoice Settings", href: "/finance/settings", icon: Settings, phase: "beta" },
        ],
      },
    ],
  },
  {
    label: "Yönetim",
    labelEn: "Administration",
    icon: ShieldCheck,
    subgroups: [
      {
        label: "Kullanıcılar",
        labelEn: "Users",
        items: [
          { label: "Kullanıcı & Yetki", labelEn: "Users & Permissions", href: "/users", icon: ShieldCheck, phase: "beta" },
          { label: "Test Hesapları", labelEn: "Test Accounts", href: "/test-accounts", icon: UserCog, phase: "v1" },
        ],
      },
      {
        label: "Sistem",
        labelEn: "System",
        items: [{ label: "Sistem Ayarları", labelEn: "System Settings", href: "/system-settings", icon: Settings, phase: "beta" }],
      },
      {
        label: "Yol Haritası",
        labelEn: "Roadmap",
        items: [{ label: "Ürün Geliştirme", labelEn: "Product Roadmap", href: "/roadmap", icon: Milestone, phase: "v1" }],
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
