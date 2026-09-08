import { ApolloError, record, text, validatePersonId, type ApolloSearch, type ApolloSearchResult } from "./domain";

// The credential is injected only by a Server Action, never exposed to a component.
export class ApolloClient {
  constructor(private readonly apiKey: string, private readonly request: typeof fetch = fetch) {}

  private async post(path: string, params: URLSearchParams): Promise<unknown> {
    if (!this.apiKey.trim()) throw new ApolloError("Apollo bağlantısı henüz yapılandırılmadı.");
    let response: Response;
    try {
      response = await this.request(`https://api.apollo.io/api/v1/${path}?${params}`, {
        method: "POST",
        headers: { "x-api-key": this.apiKey, accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new ApolloError("Apollo bağlantısı tamamlanamadı. Zenginleştirme isteği otomatik tekrarlanmadı; yeniden denemeden önce kullanımını kontrol et.");
    }
    if (response.status === 401 || response.status === 403) throw new ApolloError("Apollo anahtarının ve hesap API izinlerinin kontrol edilmesi gerekiyor.");
    if (response.status === 429) throw new ApolloError("Apollo kullanım limiti doldu. Bir süre sonra tekrar dene.");
    if (!response.ok) throw new ApolloError("Apollo isteği başarısız oldu. Yeniden denemeden önce hesap durumunu kontrol et.");
    try { return await response.json(); } catch { throw new ApolloError("Apollo yanıtı okunamadı."); }
  }

  async search(input: ApolloSearch): Promise<ApolloSearchResult> {
    const params = new URLSearchParams({ page: String(input.page), per_page: "10" });
    if (input.keywords) params.set("q_keywords", input.keywords);
    if (input.title) params.append("person_titles[]", input.title);
    if (input.location) params.append("person_locations[]", input.location);
    const result = record(await this.post("mixed_people/api_search", params));
    if (!Array.isArray(result.people) || typeof result.total_entries !== "number" || !Number.isFinite(result.total_entries) || result.total_entries < 0) {
      throw new ApolloError("Apollo arama yanıtı beklenen biçimde değil.");
    }
    const people = result.people.map((value: unknown) => {
      const person = record(value);
      return {
        id: validatePersonId(person.id ?? person.person_id),
        name: [text(person.first_name), text(person.last_name_obfuscated)].filter(Boolean).join(" ") || "İsim gizli",
        title: text(person.title),
        company: text(record(person.organization).name),
      };
    });
    return { people, total: result.total_entries, page: input.page };
  }

  async enrich(personId: string): Promise<unknown> {
    const params = new URLSearchParams({
      id: validatePersonId(personId),
      reveal_personal_emails: "false", reveal_phone_number: "false",
      run_waterfall_email: "false", run_waterfall_phone: "false",
    });
    const result = record(await this.post("people/match", params));
    if (!result.person) throw new ApolloError("Apollo kişi bilgisi bulamadı.");
    return result.person;
  }
}
