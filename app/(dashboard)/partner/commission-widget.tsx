export type MyCommissionRow = {
  id: string;
  proposalTitle: string;
  amount: number;
  currency: string;
  commissionRate: number;
  status: "unpaid" | "paid";
  createdAt: string;
};

const STATUS_LABEL: Record<MyCommissionRow["status"], string> = {
  unpaid: "Ödenmedi",
  paid: "Ödendi",
};
const STATUS_CLASS: Record<MyCommissionRow["status"], string> = {
  unpaid: "bg-golxp-tint text-golxp",
  paid: "bg-gofactory-tint text-gofactory",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}
function fmtAmount(n: number, currency: string) {
  return currency + " " + n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CommissionWidget({ entries }: { entries: MyCommissionRow[] }) {
  const totalsByCurrency: Record<string, { unpaid: number; paid: number }> = {};
  entries.forEach((e) => {
    totalsByCurrency[e.currency] = totalsByCurrency[e.currency] ?? { unpaid: 0, paid: 0 };
    totalsByCurrency[e.currency][e.status] += e.amount;
  });

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[13px] font-bold text-rg-ink">Komisyonlarım</div>
        {Object.keys(totalsByCurrency).length > 0 && (
          <div className="flex gap-3 text-[11px]">
            {Object.entries(totalsByCurrency).map(([currency, t]) => (
              <span key={currency} className="text-rg-ink-soft">
                {currency}: <strong className="text-golxp">{fmtAmount(t.unpaid, currency)}</strong> bekliyor
              </span>
            ))}
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-[12px] text-rg-ink-faint">
          Henüz komisyon kaydın yok — bir teklifin kabul edildiğinde burada otomatik görünecek.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-rg-line">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium text-rg-ink">{e.proposalTitle}</div>
                <div className="text-[10.5px] text-rg-ink-faint">
                  {fmtDate(e.createdAt)} · %{e.commissionRate} oran
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="text-[12.5px] font-semibold text-rg-ink">{fmtAmount(e.amount, e.currency)}</span>
                <span className={"rounded-full px-2 py-0.5 text-[10.5px] font-bold " + STATUS_CLASS[e.status]}>
                  {STATUS_LABEL[e.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
