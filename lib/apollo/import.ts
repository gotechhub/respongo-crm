import { toLead, validatePersonId, type ApolloContext, type ApolloLead } from "./domain";

export type ApolloImportResult =
  | { status: "duplicate" }
  | { status: "inserted"; leadId: string; assignment: "assigned" | "unassigned" | "failed" };

type Dependencies = {
  findExisting: (id: string, context: ApolloContext) => Promise<boolean>;
  enrich: (id: string) => Promise<unknown>;
  insert: (row: ApolloLead) => Promise<string | null>;
  assign: (id: string) => Promise<boolean>;
};

export async function importApolloPerson(personId: string, context: ApolloContext, autoAssign: boolean, deps: Dependencies): Promise<ApolloImportResult> {
  validatePersonId(personId);
  if (await deps.findExisting(personId, context)) return { status: "duplicate" };
  const row = toLead(await deps.enrich(personId), personId, context);
  const leadId = await deps.insert(row);
  if (!leadId) return { status: "duplicate" };
  let assignment: "assigned" | "unassigned" | "failed" = "unassigned";
  if (autoAssign) {
    try { assignment = await deps.assign(leadId) ? "assigned" : "unassigned"; }
    catch { assignment = "failed"; }
  }
  return { status: "inserted", leadId, assignment };
}
