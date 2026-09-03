import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CalendarEvent = {
  date: string; // YYYY-MM-DD
  title: string;
  urgent: boolean;
  link: string;
};

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseMonthParam(raw: string | undefined): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

// V2 Revizeler bölüm H: "Takvim/Zamanlama" — kullanıcının kendi görev/teklif/
// fatura/lisans/toplantı son tarihlerini tek bir ay görünümünde toplar. Bölge/rol
// bazlı karmaşık bir RLS taraması yerine (DERS 26: mevcut RLS zaten select'i
// filtreliyor) her kaynak tablo için "bana ait" filtresiyle (owner_id/assignee/
// atanan) basit paralel sorgular yapılıyor — generate_due_notifications()'daki
// AYNI kaynak/mantık, sadece tarih aralığı bir aya genişletildi ve founder/normal
// kullanıcı ayrımı yapılmadı (herkes kendi takvimini görür, DERS 26: gereksiz
// özel durum eklenmedi).
export default async function PlannerPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { year, month } = parseMonthParam(typeof searchParams.month === "string" ? searchParams.month : undefined);
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));

  // Grid Pazartesi'den başlar — ayın 1'inin haftanın kaçıncı günü olduğuna göre
  // önceki aydan gösterilecek hücre sayısı hesaplanıyor (0=Pzt...6=Paz).
  const firstWeekday = (monthStart.getUTCDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - firstWeekday);
  const gridEnd = new Date(monthEnd);
  const lastWeekday = (monthEnd.getUTCDay() + 6) % 7;
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - lastWeekday));

  const rangeStartStr = toDateKey(gridStart);
  const rangeEndStr = toDateKey(gridEnd);

  const events: CalendarEvent[] = [];
  const today = toDateKey(new Date());

  const [tasksRes, subtasksRes, proposalsRes, invoicesRes, licensesRes, partnerTasksRes, partnerMeetingsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, status, project_id, task_assignees!inner(profile_id)")
      .eq("task_assignees.profile_id", user.id)
      .neq("status", "done")
      .gte("due_date", rangeStartStr)
      .lte("due_date", rangeEndStr),
    supabase
      .from("subtasks")
      .select("id, title, due_date, is_done, task_id, tasks(project_id)")
      .eq("assignee_id", user.id)
      .eq("is_done", false)
      .gte("due_date", rangeStartStr)
      .lte("due_date", rangeEndStr),
    supabase
      .from("proposals")
      .select("id, title, valid_until, status")
      .eq("owner_id", user.id)
      .in("status", ["sent", "pending_approval"])
      .gte("valid_until", rangeStartStr)
      .lte("valid_until", rangeEndStr),
    supabase
      .from("invoices")
      .select("id, invoice_number, due_date, status")
      .eq("owner_id", user.id)
      .eq("status", "sent")
      .gte("due_date", rangeStartStr)
      .lte("due_date", rangeEndStr),
    supabase
      .from("licenses")
      .select("id, license_name, end_date, status")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .gte("end_date", rangeStartStr)
      .lte("end_date", rangeEndStr),
    supabase
      .from("partner_tasks")
      .select("id, title, due_date, status, partner_profiles!inner(profile_id)")
      .eq("partner_profiles.profile_id", user.id)
      .eq("status", "open")
      .gte("due_date", rangeStartStr)
      .lte("due_date", rangeEndStr),
    supabase
      .from("partner_meetings")
      .select("id, title, meeting_date, status, partner_id, partner_profiles!inner(profile_id)")
      .eq("partner_profiles.profile_id", user.id)
      .eq("status", "scheduled")
      .gte("meeting_date", `${rangeStartStr}T00:00:00Z`)
      .lte("meeting_date", `${rangeEndStr}T23:59:59Z`),
  ]);

  type TaskRow = { id: string; title: string; due_date: string; project_id: string };
  type SubtaskRow = { id: string; title: string; due_date: string; tasks: { project_id: string } | { project_id: string }[] | null };
  type ProposalRow = { id: string; title: string; valid_until: string };
  type InvoiceRow = { id: string; invoice_number: string; due_date: string };
  type LicenseRow = { id: string; license_name: string; end_date: string };
  type PartnerTaskRow = { id: string; title: string; due_date: string };
  type PartnerMeetingRow = { id: string; title: string; meeting_date: string; partner_id: string };

  ((tasksRes.data ?? []) as TaskRow[]).forEach((t) => {
    events.push({ date: t.due_date, title: `Görev: ${t.title}`, urgent: t.due_date < today, link: `/projects/${t.project_id}` });
  });
  ((subtasksRes.data ?? []) as SubtaskRow[]).forEach((s) => {
    const taskRel = Array.isArray(s.tasks) ? s.tasks[0] : s.tasks;
    events.push({ date: s.due_date, title: `Alt görev: ${s.title}`, urgent: s.due_date < today, link: `/projects/${taskRel?.project_id ?? ""}` });
  });
  ((proposalsRes.data ?? []) as ProposalRow[]).forEach((p) => {
    events.push({ date: p.valid_until, title: `Teklif: ${p.title}`, urgent: p.valid_until < today, link: `/sales/proposals/${p.id}` });
  });
  ((invoicesRes.data ?? []) as InvoiceRow[]).forEach((i) => {
    events.push({ date: i.due_date, title: `Fatura: ${i.invoice_number}`, urgent: i.due_date < today, link: `/finance/${i.id}` });
  });
  ((licensesRes.data ?? []) as LicenseRow[]).forEach((l) => {
    events.push({ date: l.end_date, title: `Lisans: ${l.license_name}`, urgent: l.end_date < today, link: `/licenses/${l.id}` });
  });
  ((partnerTasksRes.data ?? []) as PartnerTaskRow[]).forEach((pt) => {
    events.push({ date: pt.due_date, title: `İş ortağı görevi: ${pt.title}`, urgent: pt.due_date < today, link: "/partner" });
  });
  ((partnerMeetingsRes.data ?? []) as PartnerMeetingRow[]).forEach((pm) => {
    const dateKey = String(pm.meeting_date).slice(0, 10);
    events.push({ date: dateKey, title: `Toplantı: ${pm.title}`, urgent: false, link: `/partner-admin/${pm.partner_id}` });
  });

  const eventsByDate = new Map<string, CalendarEvent[]>();
  events.forEach((e) => {
    if (!eventsByDate.has(e.date)) eventsByDate.set(e.date, []);
    eventsByDate.get(e.date)!.push(e);
  });

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d));
  }

  const monthLabel = monthStart.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const prevMonth = new Date(Date.UTC(year, month - 1, 1));
  const nextMonth = new Date(Date.UTC(year, month + 1, 1));
  const prevMonthParam = `${prevMonth.getUTCFullYear()}-${String(prevMonth.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextMonthParam = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <Topbar title="Takvim" subtitle="Görevlerin, tekliflerin, faturaların, lisanslarının ve toplantılarının son tarihleri." />

      <div className="mb-4 flex items-center justify-between">
        <div className="text-[15px] font-bold capitalize text-rg-ink">{monthLabel}</div>
        <div className="flex gap-2">
          <Link
            href={`/planner?month=${prevMonthParam}`}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-rg-line bg-rg-surface text-rg-ink-soft hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/planner?month=${nextMonthParam}`}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-rg-line bg-rg-surface text-rg-ink-soft hover:border-primary hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="grid grid-cols-7 border-b border-rg-line bg-rg-surface-alt">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="px-2 py-2 text-center text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = toDateKey(d);
            const dayEvents = eventsByDate.get(key) ?? [];
            const inMonth = d.getUTCMonth() === month;
            const isToday = key === today;
            return (
              <div
                key={key}
                className={`min-h-[104px] border-b border-r border-rg-line p-1.5 ${inMonth ? "" : "bg-rg-surface-alt/40"}`}
              >
                <div
                  className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isToday ? "bg-primary text-white" : inMonth ? "text-rg-ink" : "text-rg-ink-faint"
                  }`}
                >
                  {d.getUTCDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <Link
                      key={idx}
                      href={e.link}
                      className={`block truncate rounded-[6px] px-1.5 py-[3px] text-[10px] font-medium ${
                        e.urgent ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
                      }`}
                      title={e.title}
                    >
                      {e.title}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="px-1.5 text-[9.5px] font-semibold text-rg-ink-faint">+{dayEvents.length - 3} daha</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
