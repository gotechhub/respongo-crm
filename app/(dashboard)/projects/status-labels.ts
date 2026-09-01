import type { ProjectStatus, TaskStatus } from "./actions";

// Destek/Lisans modüllerindeki aynı desen: tek doğruluk kaynağı, hem liste
// hem detay sayfası buradan okuyor — etiket/renk kayması olmasın diye.
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Aktif",
  on_hold: "Beklemede",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};

export const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  active: "bg-gofactory-tint text-gofactory",
  on_hold: "bg-golxp-tint text-golxp",
  completed: "bg-rg-surface-alt text-rg-ink-soft",
  cancelled: "bg-destructive/10 text-destructive",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Yapılacak",
  in_progress: "Devam Ediyor",
  done: "Tamamlandı",
};

export const TASK_STATUS_CLASS: Record<TaskStatus, string> = {
  todo: "bg-rg-surface-alt text-rg-ink-soft",
  in_progress: "bg-golxp-tint text-golxp",
  done: "bg-gofactory-tint text-gofactory",
};
