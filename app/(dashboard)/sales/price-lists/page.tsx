import Image from "next/image";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LOGO } from "@/lib/product-logos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

type PriceListItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  unit_price: number;
};

type PriceList = {
  id: string;
  name: string;
  product: string;
  currency: string;
  is_active: boolean;
  price_list_items: PriceListItem[];
};

export default async function PriceListsPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("price_lists")
    .select("id, name, product, currency, is_active, price_list_items(id, name, description, unit, unit_price)")
    .order("product", { ascending: true });

  const priceLists = (data ?? []) as PriceList[];

  return (
    <>
      <Topbar
        title="Fiyat Listeleri"
        subtitle="Ürün kataloğu respongo.com'daki güncel ürün yapısından alındı — birim fiyatlar henüz girilmedi (0), her ürün kuruma özel teklifle satılıyor."
      />
      <div className="flex flex-col gap-6">
        {priceLists.length === 0 && (
          <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[11.5px] text-rg-ink-faint">
            Henüz fiyat listesi yok.
          </div>
        )}
        {priceLists.map((list) => (
          <div key={list.id} className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
            <div className="flex items-center justify-between border-b border-rg-line bg-rg-surface-alt px-4 py-3">
              <div className="flex items-center gap-2.5">
                {PRODUCT_LOGO[list.product] ? (
                  <Image
                    src={PRODUCT_LOGO[list.product].src}
                    alt={PRODUCT_LABEL[list.product] ?? list.product}
                    width={PRODUCT_LOGO[list.product].width}
                    height={PRODUCT_LOGO[list.product].height}
                    className="h-5 w-auto"
                  />
                ) : (
                  <span className="font-display text-[13px] font-bold text-rg-ink">
                    {PRODUCT_LABEL[list.product] ?? list.product}
                  </span>
                )}
                <span className="text-[11.5px] text-rg-ink-faint">{list.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-rg-ink-faint">{list.currency}</span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-2 text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
                    Kalem
                  </th>
                  <th className="px-4 py-2 text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
                    Açıklama
                  </th>
                  <th className="px-4 py-2 text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
                    Birim
                  </th>
                  <th className="px-4 py-2 text-right text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
                    Birim Fiyat
                  </th>
                </tr>
              </thead>
              <tbody>
                {(list.price_list_items ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-rg-line">
                    <td className="px-4 py-2.5 text-[12.5px] font-semibold text-rg-ink">{item.name}</td>
                    <td className="px-4 py-2.5 text-[11.5px] text-rg-ink-faint">{item.description || "—"}</td>
                    <td className="px-4 py-2.5 text-[12px] text-rg-ink-soft">{item.unit}</td>
                    <td className="px-4 py-2.5 text-right text-[12.5px] font-semibold text-rg-ink">
                      {item.unit_price > 0
                        ? `${item.unit_price.toLocaleString("tr-TR")} ${list.currency}`
                        : "Teklife özel"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
