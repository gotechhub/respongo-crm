import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), search: vi.fn(), enrich: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/apollo/client", () => ({ ApolloClient: class { search = mocks.search; enrich = mocks.enrich; } }));

import { importApollo, searchApollo } from "@/app/(dashboard)/sales/leads/apollo-actions";

function setup(role = "founder", active = true, loggedIn = true) {
  const profile = { id: "user-1", role, region: "tr", is_active: active };
  const existing = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
  const inserted = { select: vi.fn().mockResolvedValue({ data: [{ id: "lead-1" }], error: null }) };
  const leads = { ...existing, upsert: vi.fn().mockReturnValue(inserted) };
  const profiles = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: profile, error: null }) };
  const db = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: loggedIn ? { id: "user-1" } : null }, error: null }) },
    from: vi.fn((table: string) => table === "profiles" ? profiles : leads),
    rpc: vi.fn().mockResolvedValue({ data: "owner-1", error: null }),
  };
  mocks.createClient.mockReturnValue(db);
  mocks.enrich.mockResolvedValue({ id: "person-1", email: "person@example.com", email_status: "verified", organization: { name: "Example" } });
  return { db, leads, profiles, inserted };
}

beforeEach(() => { vi.clearAllMocks(); });
describe("Apollo Server Actions", () => {
  it.each([["customer", true, true], ["founder", false, true], ["founder", true, false]])("blocks direct requests from invalid sessions (%s)", async (role, active, loggedIn) => {
    const { leads } = setup(role, active, loggedIn);
    expect((await searchApollo({ keywords: "test", page: 1 }, "tr")).ok).toBe(false);
    expect((await importApollo("person-1", "tr", true, true)).ok).toBe(false);
    expect(mocks.search).not.toHaveBeenCalled();
    expect(mocks.enrich).not.toHaveBeenCalled();
    expect(leads.upsert).not.toHaveBeenCalled();
  });
  it("requires explicit credit consent before enrichment", async () => {
    setup();
    expect((await importApollo("person-1", "tr", true, false)).ok).toBe(false);
    expect(mocks.enrich).not.toHaveBeenCalled();
  });
  it("uses session RLS, forced region, and ignoreDuplicates without overwriting", async () => {
    const { leads, db } = setup("region_admin");
    expect(await importApollo("person-1", "global", true, true)).toMatchObject({ ok: true, data: { status: "inserted", assignment: "assigned" } });
    expect(leads.upsert).toHaveBeenCalledWith(expect.objectContaining({ region: "tr", source_type: "apollo", created_by: "user-1" }), { onConflict: "region,contact_email_norm", ignoreDuplicates: true });
    expect(db.rpc).toHaveBeenCalledWith("auto_assign_lead", { p_lead_id: "lead-1" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/sales/leads");
  });
  it("stops before enrichment if dedup lookup fails", async () => {
    const { leads } = setup();
    leads.limit.mockResolvedValue({ data: null, error: { message: "SECRET DATABASE INFO" } });
    const result = await importApollo("person-1", "tr", true, true);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(mocks.enrich).not.toHaveBeenCalled();
  });
  it("does not claim a failed database write succeeded", async () => {
    const { inserted, db } = setup();
    inserted.select.mockResolvedValue({ data: null, error: { message: "SECRET" } });
    const result = await importApollo("person-1", "tr", true, true);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(db.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
