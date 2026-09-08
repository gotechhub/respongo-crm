import { describe, expect, it, vi } from "vitest";
import { authorizeApollo, parseSearch, toLead } from "./domain";
import { ApolloClient } from "./client";
import { importApolloPerson } from "./import";

const founder = { id: "user-1", role: "founder", region: null, is_active: true };
const person = { id: "person-1", name: "Test Person", email: " TEST@EXAMPLE.COM ", email_status: "verified", organization: { name: "Example" } };

describe("Apollo permissions and mapping", () => {
  it("requires an active manager and forces the region administrator's own region", () => {
    expect(authorizeApollo(founder, "global")).toEqual({ userId: "user-1", region: "global" });
    expect(authorizeApollo({ ...founder, role: "region_admin", region: "tr" }, "global").region).toBe("tr");
    for (const profile of [null, { ...founder, is_active: false }, { ...founder, role: "customer" }, { ...founder, role: "sales_inhouse" }]) {
      expect(() => authorizeApollo(profile, "tr")).toThrow();
    }
    expect(() => authorizeApollo(founder, "all")).toThrow();
  });
  it("rejects empty, oversized filters and invalid pagination", () => {
    expect(() => parseSearch({ keywords: "", page: 1 })).toThrow();
    expect(() => parseSearch({ keywords: "x".repeat(201), page: 1 })).toThrow();
    expect(() => parseSearch({ keywords: "learning", page: 501 })).toThrow();
    expect(() => parseSearch({ keywords: "learning", page: 1.5 })).toThrow();
    expect(parseSearch({ keywords: " learning ", title: "Director", location: "Turkey", page: 1 }).keywords).toBe("learning");
  });
  it("maps only trusted enriched company and verified business email to a new lead", () => {
    expect(toLead(person, "person-1", { userId: "user-1", region: "tr" })).toMatchObject({
      company_name: "Example", contact_email: "test@example.com", source_type: "apollo", external_ref: "person-1", region: "tr", created_by: "user-1", owner_id: null, status: "yeni",
    });
    for (const invalid of [null, { ...person, id: "different" }, { ...person, email: null }, { ...person, email_status: "unverified" }, { ...person, email: "email_not_unlocked@domain.com" }, { ...person, organization: null }]) {
      expect(() => toLead(invalid, "person-1", { userId: "user-1", region: "tr" })).toThrow();
    }
  });
});

describe("Apollo HTTP boundary", () => {
  it("uses the current search endpoint and returns a restricted preview", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ total_entries: 1, people: [{ id: "person-1", first_name: "Test", last_name_obfuscated: "P***", title: "Director", organization: { name: "Example" }, email: "private@example.com" }] })));
    const client = new ApolloClient("test-key", request);
    const result = await client.search(parseSearch({ keywords: "learning", page: 1 }));
    expect(String(request.mock.calls[0][0])).toContain("/api/v1/mixed_people/api_search?");
    expect(request.mock.calls[0][1]).toMatchObject({ method: "POST", cache: "no-store", redirect: "error", headers: { "x-api-key": "test-key" } });
    expect(result.people[0]).toEqual({ id: "person-1", name: "Test P***", title: "Director", company: "Example" });
    expect(JSON.stringify(result)).not.toContain("private@example.com");
  });
  it("does not retry paid enrichment or reveal private emails/phones", async () => {
    const request = vi.fn().mockResolvedValue(new Response("SECRET RESPONSE", { status: 429 }));
    const client = new ApolloClient("test-key", request);
    await expect(client.enrich("person-1")).rejects.toThrow("limit");
    expect(request).toHaveBeenCalledTimes(1);
    const url = new URL(String(request.mock.calls[0][0]));
    expect(url.searchParams.get("reveal_personal_emails")).toBe("false");
    expect(url.searchParams.get("reveal_phone_number")).toBe("false");
  });
  it("rejects bad responses and missing credentials without leaking upstream content", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ people: "broken" })));
    await expect(new ApolloClient("test-key", request).search(parseSearch({ keywords: "test", page: 1 }))).rejects.toThrow();
    const missing = vi.fn();
    await expect(new ApolloClient("", missing).enrich("person-1")).rejects.toThrow();
    expect(missing).not.toHaveBeenCalled();
  });
});

describe("Apollo import orchestration", () => {
  function dependencies() {
    return {
      findExisting: vi.fn().mockResolvedValue(false),
      enrich: vi.fn().mockResolvedValue(person),
      insert: vi.fn().mockResolvedValue("lead-1"),
      assign: vi.fn().mockResolvedValue(true),
    };
  }
  const context = { userId: "user-1", region: "tr" as const };
  it("checks duplicates before spending enrichment credits", async () => {
    const deps = dependencies();
    deps.findExisting.mockResolvedValue(true);
    expect(await importApolloPerson("person-1", context, true, deps)).toEqual({ status: "duplicate" });
    expect(deps.enrich).not.toHaveBeenCalled();
    expect(deps.insert).not.toHaveBeenCalled();
  });
  it("does not call Apollo when the duplicate lookup fails", async () => {
    const deps = dependencies();
    deps.findExisting.mockRejectedValue(new Error("lookup failed"));
    await expect(importApolloPerson("person-1", context, true, deps)).rejects.toThrow();
    expect(deps.enrich).not.toHaveBeenCalled();
  });
  it("preserves existing records on email conflict and skips assignment", async () => {
    const deps = dependencies();
    deps.insert.mockResolvedValue(null);
    expect(await importApolloPerson("person-1", context, true, deps)).toEqual({ status: "duplicate" });
    expect(deps.assign).not.toHaveBeenCalled();
  });
  it("reports assignment failure as a warning after successful insertion", async () => {
    const deps = dependencies();
    deps.assign.mockRejectedValue(new Error("RPC unavailable"));
    expect(await importApolloPerson("person-1", context, true, deps)).toMatchObject({ status: "inserted", leadId: "lead-1", assignment: "failed" });
    expect(deps.insert).toHaveBeenCalledTimes(1);
  });
  it("rejects an unusable enrichment without creating a lead", async () => {
    const deps = dependencies();
    deps.enrich.mockResolvedValue({ ...person, email: null });
    await expect(importApolloPerson("person-1", context, false, deps)).rejects.toThrow();
    expect(deps.insert).not.toHaveBeenCalled();
  });
});
