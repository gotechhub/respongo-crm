import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const PRODUCT_ORDER = ["golms", "golxp", "gocatalog", "gofactory", "gotools", "genel"];

type PriceListItemRef = { name: string; unit: string; unit_price: number } | null;

type TemplateItem = {
  id: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  price_list_item_id: string | null;
  price_list_items: PriceListItemRef | PriceListItemRef[] | null;
};

type ProposalTemplate = {
  id: string;
  name: string;
  product: string | null;
  language: "tr" | "en";
  description: string | null;
  valid_days: number;
  intro_text: string | null;
  terms_text: string | null;
  proposal_template_items: TemplateItem[];
};

function itemRef(item: TemplateItem): PriceListItemRef {
  const v = item.price_list_items;
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default async function ProposalTemplatesPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("proposal_templates")
    .select(
      "id, name, product, language, description, valid_days, intro_text, terms_text, proposal_template_items(id, description, quantity, unit_price, discount_percent, price_list_item_id, price_list_items(name, unit, unit_price))"
    );

  const templates = (data ?? []) as ProposalTemplate[];

  const grouped: Record<string, ProposalTemplate[]> = {};
  templates.forEach((t) => {
    const key = t.product ?? "genel";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });
  Object.values(grouped).forEach((list) => list.sort((a, b) => a.language.localeCompare(b.language)));

  return (
    <>
      <Topbar
        title="Teklif Şablonları"
        subtitle="Ürün başına TR + EN hazırlanmış 6 şablon (5 ürün + genel ekosistem) — Teklif Oluştur ekranı bunları temel alacak."
      />
      <div className="flex flex-col gap-8">
        {templates.length === 0 && (
          <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[11.5px] text-rg-ink-faint">
            Henüz teklif şablonu yok.
          </div>
        )}
        {PRODUCT_ORDER.filter((key) => grouped[key]?.length).map((key) => (
          <div key={key} className="flex flex-col gap-3">
            <h2 className="font-display text-[13.5px] font-bold text-rg-ink">
              {key === "genel" ? "Genel Ekosistem" : PRODUCT_LABEL[key]}
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {grouped[key].map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg"
                >
                  <div className="flex items-center justify-between border-b border-rg-line bg-rg-surface-alt px-4 py-3">
                    <div>
                      <span
                        className={
                          "mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase " +
                          (t.language === "tr" ? "bg-golms-tint text-golms" : "bg-golxp-tint text-golxp")
                        }
                      >
                        {t.language}
                      </span>
                      <span className="font-display text-[12.8px] font-bold text-rg-ink">{t.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-rg-ink-faint">
                      {t.valid_days} gün geçerli
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 px-4 py-3.5">
                    {t.description && (
                      <p className="text-[11.5px] italic text-rg-ink-faint">{t.description}</p>
                    )}
                    {t.intro_text && (
                      <p className="text-[12.5px] leading-relaxed text-rg-ink-soft">{t.intro_text}</p>
                    )}
                    {(t.proposal_template_items ?? []).length > 0 && (
                      <table className="w-full border-collapse">
                        <tbody>
                          {(t.proposal_template_items ?? []).map((item) => {
                            const ref = itemRef(item);
                            return (
                              <tr key={item.id} className="border-t border-rg-line">
                                <td className="py-1.5 pr-2 text-[11.8px] font-semibold text-rg-ink">
                                  {ref?.name ?? item.description ?? "—"}
                                </td>
                                <td className="py-1.5 text-right text-[11px] text-rg-ink-faint">
                                  {ref
                                    ? ref.unit_price > 0
                                      ? `${ref.unit_price.toLocaleString("tr-TR")} / ${ref.unit}`
                                      : "Teklife özel"
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                    {t.terms_text && (
                      <p className="border-t border-rg-line pt-2.5 text-[10.8px] leading-relaxed text-rg-ink-faint">
                        {t.terms_text.replace("{valid_days}", String(t.valid_days))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
