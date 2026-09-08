import type { Region } from "../roles";

export class ApolloError extends Error {}
export type ApolloContext = { userId: string; region: Region };
export type ApolloSearch = { keywords: string; title: string; location: string; page: number };
export type ApolloPreview = { id: string; name: string; title: string; company: string };
export type ApolloSearchResult = { people: ApolloPreview[]; total: number; page: number };

export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
export function authorizeApollo(profile: unknown, chosenRegion: unknown): ApolloContext {
  const me = record(profile);
  if (!me.id || me.is_active !== true || (me.role !== "founder" && me.role !== "region_admin")) {
    throw new ApolloError("Apollo işlemleri yalnız aktif Süper Admin ve Bölge Yöneticisine açıktır.");
  }
  const region = me.role === "founder" ? chosenRegion : me.region;
  if (region !== "tr" && region !== "global") throw new ApolloError("Türkiye veya Global bölgesini seç.");
  return { userId: text(me.id), region };
}
export function parseSearch(input: unknown): ApolloSearch {
  const raw = record(input);
  const keywords = text(raw.keywords);
  const title = text(raw.title);
  const location = text(raw.location);
  const page = raw.page ?? 1;
  if (![keywords, title, location].some(Boolean)) throw new ApolloError("En az bir arama filtresi gir.");
  if ([keywords, title, location].some((v) => v.length > 200)) throw new ApolloError("Arama alanları en fazla 200 karakter olabilir.");
  if (typeof page !== "number" || !Number.isInteger(page) || page < 1 || page > 500) throw new ApolloError("Geçersiz sayfa numarası.");
  return { keywords, title, location, page };
}
export function validatePersonId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new ApolloError("Geçersiz Apollo kişi kimliği.");
  return value;
}
export function toLead(value: unknown, expectedId: string, context: ApolloContext) {
  const person = record(value);
  const id = text(person.id) || text(person.person_id);
  const email = text(person.email).toLowerCase();
  const company = text(record(person.organization).name);
  if (id !== expectedId) throw new ApolloError("Apollo kişi eşleşmesi doğrulanamadı; kayıt eklenmedi.");
  if (!company || company.length > 500) throw new ApolloError("Firma bilgisi bulunamadı; kayıt eklenmedi.");
  if (person.email_status !== "verified" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || email.includes("email_not_unlocked")) {
    throw new ApolloError("Doğrulanmış iş e-postası bulunamadı; kayıt eklenmedi. Apollo sorgusu kredi kullanmış olabilir.");
  }
  return {
    company_name: company,
    contact_name: text(person.name) || null,
    contact_email: email,
    region: context.region,
    source_type: "apollo" as const,
    external_ref: id,
    status: "yeni" as const,
    currency: context.region === "tr" ? "TRY" : "USD",
    created_by: context.userId,
    owner_id: null,
  };
}
export type ApolloLead = ReturnType<typeof toLead>;
