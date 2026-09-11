import { describe, expect, it } from "vitest";
import { createStudioSections, sectionDisplayName, starterTemplateName } from "./template-studio";

describe("proposal template studio blueprint", () => {
  it("creates the complete ordered bilingual document outline", () => {
    const sections = createStudioSections("golms");
    expect(sections).toHaveLength(8);
    expect(sections.map((section) => section.sort_order)).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
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
  it("keeps legal copy empty and labels regional legal sections clearly", () => {
    expect(createStudioSections().filter((section) => section.section_type === "legal_terms").every((section) => !section.body_tr && !section.body_en)).toBe(true);
    expect(sectionDisplayName("legal_terms", "tr")).toContain("Türkiye");
    expect(sectionDisplayName("legal_terms", "us")).toContain("Global");
  });
});
