export default function LoginPage() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-rg-bg px-4">
    <div className="w-full max-w-sm rounded-2xl border border-rg-line bg-rg-surface p-8 shadow-rg">
      <div className="mb-6 text-center"><div className="font-display text-lg font-bold text-rg-ink">Respongo <span className="text-primary">CRM</span></div><p className="mt-1 text-[13px] text-rg-ink-soft">Test ortamı erişimi</p></div>
      <a href="/api/test-login" className="block w-full rounded-[10px] bg-primary px-4 py-2.5 text-center text-[13.5px] font-semibold text-white transition-colors hover:brightness-[1.08]">Test ortamına gir</a>
    </div>
    <p className="text-[11.5px] text-rg-ink-faint">Geçici test erişimi · final canlı açılışında kaldırılacak.</p>
  </main>;
}
