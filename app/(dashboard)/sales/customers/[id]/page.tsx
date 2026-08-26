import { PageStub } from "@/components/shared/page-stub";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageStub
      title="Müşteri Detayı"
      subtitle={`Kayıt: ${params.id}`}
      note="Müşteri detay görünümü bir sonraki adımda kuruluyor."
    />
  );
}
