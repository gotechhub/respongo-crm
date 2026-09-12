import { describe, expect, it } from "vitest";
import { createStudioSections, sectionDisplayName, starterTemplateName } from "./template-studio";

describe("proposal template studio blueprint", () => {
  it("creates the complete ordered bilingual document outline", () => {
    const sections = createStudioSections("golms");
    // V5 (2026-09-11): teknik özellikler, uygulama planı ve destek/SLA bölümleri eklendi (kullanıcı
    // isteği: "teknik detaylar ve teklif koşulları gerçekçi ve en iyi şekilde yap") — 8 bölümden 11'e çıktı.
    expect(sections).toHaveLength(11);
    expect(sections.map((section) => section.sort_order)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]);
    expect(sections.filter((section) => section.section_type === "legal_terms").map((section) => section.legal_region)).toEqual(["tr", "us"]);
    // V4 (2026-09-11): kapsam artık respongo.com'dan alınan gerçek ürün bilgisiyle önceden
    // doldurulur (kullanıcı isteği: "daha kaliteli gerçekçi ve daha detaylı olsun") — eskiden
    // dört boş dizi olan bu içerik artık her dilde en az bir gerçek madde taşımalı.
    const scopeContent = sections.find((section) => section.section_type === "scope")?.content as Record<string, unknown[]>;
    expect(scopeContent.included_tr.length).toBeGreaterThan(0);
    expect(scopeContent.included_en.length).toBeGreaterThan(0);
    expect(scopeContent.excluded_tr.length).toBeGreaterThan(0);
    expect(scopeContent.excluded_en.length).toBeGreaterThan(0);
  });
  it("fills both languages on the same row — no more per-language forking", () => {
    const sections = createStudioSections("gofactory");
    const cover = sections.find((section) => section.section_type === "cover");
    expect(cover?.title_tr).toBe("Teklif");
    expect(cover?.title_en).toBe("Proposal");
    expect(cover?.body_tr).not.toBe("");
    expect(cover?.body_en).not.toBe("");
    expect(starterTemplateName("gofactory")).toContain("Kurumsal Teklif");
  });
  it("fills the new technical, implementation and support sections with real content", () => {
    const sections = createStudioSections("gotools");
    const technical = sections.find((section) => section.section_type === "technical_specs")?.content as Record<string, unknown[]>;
    expect((technical.items_tr as unknown[]).length).toBeGreaterThan(0);
    expect((technical.items_en as unknown[]).length).toBeGreaterThan(0);
    const timeline = sections.find((section) => section.section_type === "implementation_timeline")?.content as Record<string, unknown[]>;
    expect((timeline.phases_tr as unknown[]).length).toBeGreaterThan(0);
    expect((timeline.phases_en as unknown[]).length).toBeGreaterThan(0);
    const support = sections.find((section) => section.section_type === "support_sla")?.content as Record<string, unknown[]>;
    expect((support.tiers_tr as unknown[]).length).toBeGreaterThan(0);
    expect((support.tiers_en as unknown[]).length).toBeGreaterThan(0);
  });
  it("gives legal/commercial terms a real, clearly-labelled draft instead of leaving it empty", () => {
    // V5 (2026-09-11): önceki davranış (bilerek boş bırakmak) kullanıcının açık talebiyle değişti —
    // artık gerçekçi bir taslak var, ama her ikisi de en üstte "hukuk danışmanınızca onaylanmalı"
    // uyarısı taşıyor, böylece hukuki tavsiye gibi sunulmuyor.
    const legalSections = createStudioSections().filter((section) => section.section_type === "legal_terms");
    for (const section of legalSections) {
      expect(section.body_tr).toContain("TASLAK");
      expect(section.body_en).toContain("DRAFT");
      expect((section.body_tr as string).length).toBeGreaterThan(100);
      expect((section.body_en as string).length).toBeGreaterThan(100);
    }
    expect(sectionDisplayName("legal_terms", "tr")).toContain("Türkiye");
    expect(sectionDisplayName("legal_terms", "us")).toContain("Global");
  });
});
