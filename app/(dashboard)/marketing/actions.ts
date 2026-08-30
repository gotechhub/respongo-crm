"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/roles";
import type { ProductKey } from "../sales/proposals/actions";

type ActionResult = { ok: true } | { ok: false; error: string };

export type CampaignChannel =
  | "google_ads"
  | "linkedin_ads"
  | "instagram_ads"
  | "youtube_ads"
  | "email"
  | "content"
  | "webinar"
  | "event"
  | "referral_program"
  | "partnership"
  | "other";

export type CampaignStatus = "planned" | "active" | "paused" | "completed" | "cancelled";

export type CampaignInput = {
  name: string;
  channel: CampaignChannel;
  product: ProductKey | "";
  region: Region | ""; // "" => global (sadece founder ayarlayabilir)
  budget: number;
  currency: string;
  startDate: string; // "" | "YYYY-MM-DD"
  endDate: string;
  goalLeads: number | null;
  description: string;
  ownerId: string | null;
};

function toRow(input: CampaignInput) {
  return {
    name: input.name.trim(),
    channel: input.channel,
    product: input.product || null,
    region: input.region || null,
    budget: input.budget || 0,
    currency: input.currency || "USD",
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    goal_leads: input.goalLeads,
    description: input.description.trim() || null,
    owner_id: input.ownerId,
  };
}

export async function createCampaign(input: CampaignInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.name.trim()) {
    return { ok: false, error: "Kampanya adı zorunlu." };
  }

  const { error } = await supabase.from("marketing_campaigns").insert({
    ...toRow(input),
    created_by: user.id,
    owner_id: input.ownerId ?? user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/marketing");
  return { ok: true };
}

export async function updateCampaign(id: string, input: CampaignInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.name.trim()) {
    return { ok: false, error: "Kampanya adı zorunlu." };
  }

  const { error, count } = await supabase
    .from("marketing_campaigns")
    .update(toRow(input), { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kampanyayı güncelleme yetkin yok." };
  }

  revalidatePath("/marketing");
  revalidatePath(`/marketing/${id}`);
  return { ok: true };
}

const STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  planned: ["active", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function updateCampaignStatus(id: string, next: CampaignStatus): Promise<ActionResult> {
  const supabase = createClient();
  const { data: campaign } = await supabase.from("marketing_campaigns").select("status").eq("id", id).single();
  if (!campaign) {
    return { ok: false, error: "Kampanya bulunamadı." };
  }
  const current = campaign.status as CampaignStatus;
  if (!STATUS_TRANSITIONS[current].includes(next)) {
    return { ok: false, error: "Bu durum geçişi yapılamaz." };
  }

  const { error, count } = await supabase
    .from("marketing_campaigns")
    .update({ status: next }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kampanyayı güncelleme yetkin yok." };
  }

  revalidatePath("/marketing");
  revalidatePath(`/marketing/${id}`);
  return { ok: true };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("marketing_campaigns").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kampanyayı silme yetkin yok." };
  }

  revalidatePath("/marketing");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Lead attribution — bir lead kaydını kampanyaya bağla / kampanyadan kaldır.
// Not: leads tablosunda marketing rolü için sadece bu iki action'ın gönderdiği
// campaign_id alanına izin verilecek şekilde UI tasarlandı (bkz. migration
// leads_marketing_update_campaign notu) — bu action'lar başka hiçbir lead
// alanını güncellemez.
// ----------------------------------------------------------------------------

export async function attachLeadToCampaign(leadId: string, campaignId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("leads")
    .update({ campaign_id: campaignId }, { count: "exact" })
    .eq("id", leadId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu lead'i bağlama yetkin yok." };
  }

  revalidatePath(`/marketing/${campaignId}`);
  return { ok: true };
}

export type LeadSearchRow = { id: string; company_name: string; contact_name: string | null; campaign_id: string | null };

export async function searchLeadsForAttach(q: string): Promise<LeadSearchRow[]> {
  if (!q.trim()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("leads")
    .select("id, company_name, contact_name, campaign_id")
    .ilike("company_name", `%${q.trim()}%`)
    .is("campaign_id", null)
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []) as LeadSearchRow[];
}

export async function detachLeadFromCampaign(leadId: string, campaignId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("leads")
    .update({ campaign_id: null }, { count: "exact" })
    .eq("id", leadId)
    .eq("campaign_id", campaignId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu lead'i kaldırma yetkin yok." };
  }

  revalidatePath(`/marketing/${campaignId}`);
  return { ok: true };
}
