import { PageStub } from "@/components/shared/page-stub";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageStub
      title="Proje Detayı"
      subtitle={`Kayıt: ${params.id}`}
      note="Proje detay görünümü (ana görev / alt görev listesi) bir sonraki adımda kuruluyor."
    />
  );
}
