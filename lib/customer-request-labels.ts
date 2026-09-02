// V2 Revizeler bölüm B: müşteri portalından açılan satın alım/yenileme/yeni proje-ürün-hizmet
// talepleri için ortak etiketler — hem portal (müşteri tarafı) hem iç CRM (Müşteri Talepleri
// yönetim ekranı) aynı sözlüğü kullanıyor.
export type CustomerRequestType = "purchase" | "renewal" | "new_project" | "new_product" | "new_service";
export type CustomerRequestStatus = "new" | "in_review" | "in_progress" | "completed" | "declined";

export const REQUEST_TYPE_LABEL: Record<CustomerRequestType, string> = {
  purchase: "Yeni Satın Alım",
  renewal: "Lisans Yenileme",
  new_project: "Yeni Proje Talebi",
  new_product: "Yeni Ürün Talebi",
  new_service: "Yeni Hizmet Talebi",
};

export const REQUEST_STATUS_LABEL: Record<CustomerRequestStatus, string> = {
  new: "Yeni",
  in_review: "İncelemede",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  declined: "Reddedildi",
};

export const REQUEST_STATUS_CLASS: Record<CustomerRequestStatus, string> = {
  new: "bg-golxp-tint text-golxp",
  in_review: "bg-gotools-tint text-gotools",
  in_progress: "bg-golms-tint text-golms",
  completed: "bg-gofactory-tint text-gofactory",
  declined: "bg-destructive/10 text-destructive",
};

export const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};
