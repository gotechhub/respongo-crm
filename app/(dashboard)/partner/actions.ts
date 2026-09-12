"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

// Partner ilk kez /partner sayfasını açtığında partner_profiles satırı yoksa
// oluşturur (lazy provisioning). RLS (partner_profiles_self_insert) sadece
// partner_tr/partner_global rolündeki kullanıcının KENDİ profile_id'siyle
// insert yapmasına izin veriyor.
export async function ensurePartnerProfile(): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: existing } = await supabase
    .from("partner_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    return { ok: true };
  }

  const { error } = await supabase.from("partner_profiles").insert({ profile_id: user.id });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

async function updateOwnPartnerProfile(fields: Record<string, unknown>): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { error, count } = await supabase
    .from("partner_profiles")
    .update(fields, { count: "exact" })
    .eq("profile_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Güncelleme başarısız — kaydını bulamadım." };
  }

  revalidatePath("/partner");
  return { ok: true };
}

// Onboarding adım 1: sözleşme/şartlar onayı.
export async function savePartnerAgreementStep(accepted: boolean): Promise<ActionResult> {
  if (!accepted) {
    return { ok: false, error: "Devam etmek için iş ortaklığı şartlarını onaylaman gerekiyor." };
  }
  return updateOwnPartnerProfile({
    agreement_accepted_at: new Date().toISOString(),
    onboarding_step: 1,
  });
}

export type PartnerCompanyInput = {
  companyName: string;
  taxNo: string;
  website: string;
  country: string;
  address: string;
};

// Onboarding adım 2: firma/iletişim bilgileri.
export async function savePartnerCompanyStep(input: PartnerCompanyInput): Promise<ActionResult> {
  if (!input.companyName.trim()) {
    return { ok: false, error: "Firma adı zorunlu." };
  }
  return updateOwnPartnerProfile({
    company_name: input.companyName,
    tax_no: input.taxNo || null,
    website: input.website || null,
    country: input.country || null,
    address: input.address || null,
    onboarding_step: 2,
  });
}

export type PartnerBankInput = {
  bankName: string;
  bankAccountName: string;
  iban: string;
  swift: string;
};

// Onboarding adım 3: komisyon ödemesi için banka bilgileri.
export async function savePartnerBankStep(input: PartnerBankInput): Promise<ActionResult> {
  return updateOwnPartnerProfile({
    bank_name: input.bankName || null,
    bank_account_name: input.bankAccountName || null,
    iban: input.iban || null,
    swift: input.swift || null,
    onboarding_step: 3,
  });
}

// Onboarding adım 4: ilgilendiği ürünler.
export async function savePartnerInterestsStep(productInterests: string[]): Promise<ActionResult> {
  return updateOwnPartnerProfile({
    product_interests: productInterests,
    onboarding_step: 4,
  });
}

// Onboarding adım 5: özet ekranından tamamlama. Durum kasıtlı olarak
// 'pending_review'da bırakılıyor — trigger zaten status'u founder olmayan
// bir çağrıda değiştirtmiyor, founder /partner-admin'den 'active' yapacak.
//
// KÖK NEDEN DÜZELTMESİ ("İş ortağım paneli boş, demo içerik yok"): panel
// önceden gerçekten boştu çünkü yeni bir iş ortağı hesabı — ister kendisi
// kayıt olsun (self-onboarding), ister founder /partner-admin'den hazır
// bilgilerle oluştursun (createPartnerWithProfile) — HER İKİ yolda da
// panele ilk kez ulaştığında partner_tasks/partner_meetings/commission_
// entries tablolarında hiçbir satırı olmuyordu; bu da "sistem çalışmıyor"
// izlenimi veriyordu. Kalıcı çözüm bu iki oluşturma noktasından birine
// bağımlı tek seferlik bir migration/seed DEĞİL — onboarding'i TAMAMLAYAN
// bu fonksiyon: her iki yol da mecburen buradan geçiyor (partnerin kendisi
// sözleşmeyi onaylayıp sihirbazı bitirmeden panele giremiyor), yani burası
// "yeni bir iş ortağı panelini ilk kez görecek" anının tek, güvenilir
// noktası. Sahte lead/müşteri/komisyon verisi EKLENMİYOR (gerçek bir hesaba
// uydurma ciro/iş atfetmek yanıltıcı olur) — sadece gerçek, yapması gereken
// bir başlangıç kontrol listesi (partner_tasks) ekleniyor.
export async function completePartnerOnboarding(): Promise<ActionResult> {
  const result = await updateOwnPartnerProfile({
    onboarding_step: 5,
    onboarding_completed_at: new Date().toISOString(),
  });
  if (result.ok) {
    await seedPartnerStarterTasks();
  }
  return result;
}

const STARTER_TASKS_TR = [
  {
    title: "Kaynaklar kütüphanesini incele",
    description: "Satış konuşmaları, ürün tanıtımları ve sektörel sözlüğe Kaynaklar sayfasından ulaşabilirsin.",
    daysFromNow: 2,
  },
  {
    title: "Fiyat listelerini incele",
    description: "Sattığın ürünlerin güncel fiyat ve koşullarını Fiyat Listeleri sayfasından kontrol et.",
    daysFromNow: 2,
  },
  {
    title: "Bölge yöneticinle tanışma görüşmesi planla",
    description: "Toplantılarım bölümünden ilk oryantasyon görüşmeni ekle.",
    daysFromNow: 4,
  },
  {
    title: "İlk fırsatını sisteme kaydet",
    description: "Havuz veya Lead Ekle ile ilk potansiyel müşterini sisteme ekleyerek pipeline'ını başlat.",
    daysFromNow: 7,
  },
] as const;

const STARTER_TASKS_EN = [
  {
    title: "Explore the Resources library",
    description: "Sales pitches, product overviews and the glossary are all on the Resources page.",
    daysFromNow: 2,
  },
  {
    title: "Review the price lists",
    description: "Check the current pricing and terms for the products you'll be selling on the Price Lists page.",
    daysFromNow: 2,
  },
  {
    title: "Schedule an intro call with your regional admin",
    description: "Add your first orientation meeting from the Meetings section.",
    daysFromNow: 4,
  },
  {
    title: "Log your first opportunity",
    description: "Add your first prospect via the pool or Add Lead to kick off your pipeline.",
    daysFromNow: 7,
  },
] as const;

// Yeni onboarding'ini tamamlayan bir iş ortağına gerçek, uygulanabilir bir
// başlangıç kontrol listesi ekler — panel bomboş açılmasın diye. Bölgeye
// göre TR/EN metin seçilir (partner_tr -> TR, partner_global -> EN).
// Idempotent: partnerin zaten görevi varsa (ör. tekrar çağrılırsa) tekrar
// eklemez.
async function seedPartnerStarterTasks(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { count: existingCount } = await supabase
    .from("partner_tasks")
    .select("id", { count: "exact", head: true })
    .eq("partner_id", user.id);
  if (existingCount && existingCount > 0) return;

  const { data: profileRow } = await supabase.from("profiles").select("region").eq("id", user.id).single();
  const region = (profileRow as { region: string | null } | null)?.region;
  const starterTasks = region === "global" ? STARTER_TASKS_EN : STARTER_TASKS_TR;

  const now = Date.now();
  const rows = starterTasks.map((task) => ({
    partner_id: user.id,
    title: task.title,
    description: task.description,
    due_date: new Date(now + task.daysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "open" as const,
  }));

  await supabase.from("partner_tasks").insert(rows);
}

// --- Görevlerim (partner_tasks) ---

export type PartnerTaskInput = {
  title: string;
  description: string;
  dueDate: string; // "" veya "YYYY-MM-DD"
};

export async function createPartnerTask(input: PartnerTaskInput): Promise<ActionResult> {
  if (!input.title.trim()) {
    return { ok: false, error: "Görev başlığı zorunlu." };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { error } = await supabase.from("partner_tasks").insert({
    partner_id: user.id,
    title: input.title,
    description: input.description || null,
    due_date: input.dueDate || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/partner");
  return { ok: true };
}

export async function updatePartnerTaskStatus(taskId: string, status: "open" | "done"): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("partner_tasks")
    .update({ status }, { count: "exact" })
    .eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu görevi güncelleme yetkin yok." };
  }
  revalidatePath("/partner");
  return { ok: true };
}

export async function deletePartnerTask(taskId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("partner_tasks").delete({ count: "exact" }).eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu görevi silme yetkin yok." };
  }
  revalidatePath("/partner");
  return { ok: true };
}

// --- Toplantılarım (partner_meetings) ---

export type PartnerMeetingInput = {
  title: string;
  meetingDate: string; // "YYYY-MM-DD" veya "YYYY-MM-DDTHH:mm"
  notes: string;
};

export async function createPartnerMeeting(input: PartnerMeetingInput): Promise<ActionResult> {
  if (!input.title.trim()) {
    return { ok: false, error: "Toplantı başlığı zorunlu." };
  }
  if (!input.meetingDate) {
    return { ok: false, error: "Toplantı tarihi zorunlu." };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { error } = await supabase.from("partner_meetings").insert({
    partner_id: user.id,
    title: input.title,
    meeting_date: new Date(input.meetingDate).toISOString(),
    notes: input.notes || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/partner");
  return { ok: true };
}

export async function updatePartnerMeetingStatus(
  meetingId: string,
  status: "scheduled" | "completed" | "cancelled" | "no_show"
): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("partner_meetings")
    .update({ status }, { count: "exact" })
    .eq("id", meetingId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu toplantıyı güncelleme yetkin yok." };
  }
  revalidatePath("/partner");
  return { ok: true };
}

export async function deletePartnerMeeting(meetingId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("partner_meetings").delete({ count: "exact" }).eq("id", meetingId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu toplantıyı silme yetkin yok." };
  }
  revalidatePath("/partner");
  return { ok: true };
}
