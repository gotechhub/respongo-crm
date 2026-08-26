import { PageStub } from "@/components/shared/page-stub";

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageStub
      title="Müşteri Adayı Detayı"
      subtitle={`Kayıt: ${params.id}`}
      note="Müşteri adayı detay görünümü bir sonraki adımda kuruluyor."
    />
  );
}
