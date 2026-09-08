import { describe, expect, it } from "vitest";
import { createStudioSections, sectionDisplayName, starterTemplateName } from "./template-studio";

describe("proposal template studio blueprint", () => {
  it("creates the complete ordered bilingual document outline", () => {
    const sections = createStudioSections("golms", "tr");
    expect(sections).toHaveLength(8);
    expect(sections.map((section) => section.sort_order)).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
    expect(sections.filter((section) => section.section_type === "legal_terms").map((section) => section.legal_region)).toEqual(["tr", "us"]);
    expect(sections.find((section) => section.section_type === "scope")?.content).toEqual({ included_tr: [], included_en: [], excluded_tr: [], excluded_en: [] });
  });
  it("creates separate language-specific template copy", () => {
    const tr = createStudioSections("gofactory", "tr");
    const en = createStudioSections("gofactory", "en");
    expect(tr.find((section) => section.section_type === "cover")?.title_tr).toBe("Teklif");
    expect(tr.find((section) => section.section_type === "cover")?.title_en).toBe("");
    expect(en.find((section) => section.section_type === "cover")?.title_en).toBe("Proposal");
    expect(starterTemplateName("gofactory", "tr")).toContain("Kurumsal Teklif");
    expect(starterTemplateName("gofactory", "en")).toContain("Proposal");
  });
  it("keeps legal copy empty and labels regional legal sections clearly", () => {
    expect(createStudioSections().filter((section) => section.section_type === "legal_terms").every((section) => !section.body_tr && !section.body_en)).toBe(true);
    expect(sectionDisplayName("legal_terms", "tr")).toContain("Türkiye");
    expect(sectionDisplayName("legal_terms", "us")).toContain("Global");
  });
});
