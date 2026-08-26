import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[252px_1fr] bg-rg-bg">
      <Sidebar />
      <main className="max-w-[1400px] px-[34px] pb-[60px] pt-[26px]">
        {children}
      </main>
    </div>
  );
}
