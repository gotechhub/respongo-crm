// Respongo CRM — rol / bölge sabitleri
// supabase/migrations/20260720000001_init_schema.sql + 20260826000001-2 ile birebir eşleşir.

export type UserRole =
  | "founder"
  | "region_admin"
  | "sales_inhouse"
  | "partner_tr"
  | "partner_global"
  | "freelancer"
  | "project_member"
  | "support_agent"
  | "marketing"
  | "finance"
  | "customer";

export type Region = "tr" | "global";

export const ROLE_LABELS_TR: Record<UserRole, string> = {
  founder: "Kurucu (Süper Admin)",
  region_admin: "Bölge Yöneticisi",
  sales_inhouse: "Satış Ekibi",
  partner_tr: "Satış Ortağı (TR)",
  partner_global: "Satış Ortağı (Global)",
  freelancer: "Freelancer",
  project_member: "Proje Ekibi",
  support_agent: "Destek Ekibi",
  marketing: "Pazarlama",
  finance: "Finans",
  customer: "Müşteri",
};

export const REGION_LABELS_TR: Record<Region, string> = {
  tr: "Türkiye",
  global: "Global",
};

// Süper Admin ekranından davet edilebilecek roller (customer hariç — portal ayrı fazda).
export const INVITABLE_ROLES: UserRole[] = [
  "founder",
  "region_admin",
  "sales_inhouse",
  "partner_tr",
  "partner_global",
  "freelancer",
  "project_member",
  "support_agent",
  "marketing",
  "finance",
];

// Bölge ataması zorunlu olan roller (founder hariç hepsi — RLS bölgeye göre filtreler).
export const REGION_REQUIRED_ROLES: UserRole[] = [
  "region_admin",
  "sales_inhouse",
  "partner_tr",
  "partner_global",
  "freelancer",
  "project_member",
  "support_agent",
  "marketing",
  "finance",
];

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole | null;
  region: Region | null;
  is_active: boolean;
  created_at: string;
};
