import { Topbar } from "@/components/layout/topbar";

export function PageStub({
  title,
  subtitle,
  note,
}: {
  title: string;
  subtitle?: string;
  note: string;
}) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[11.5px] text-rg-ink-faint">
        {note}
      </div>
    </>
  );
}
