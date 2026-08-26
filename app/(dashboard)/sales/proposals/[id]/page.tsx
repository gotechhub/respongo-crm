import { PageStub } from "@/components/shared/page-stub";

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageStub
      title="Teklif Detayı"
      subtitle={`Kayıt: ${params.id}`}
      note="Teklif detay görünümü bir sonraki adımda kuruluyor."
    />
  );
}
