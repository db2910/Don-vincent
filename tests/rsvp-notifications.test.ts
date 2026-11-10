// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { rsvpSchema } from "@/lib/validation/rsvp";
const payload = rsvpSchema.parse({ fullName: "Guest", contact: "guest@example.test", attendanceStatus: "accepted", accommodationStatus: "yes", budgetCurrency: "USD", budgetAmount: 125, nights: 2, breakfastPreference: "breakfast", accommodationType: "hotel", sharingPreference: "private", roomOccupants: 2, guestMessage: "See you there!" });
const fetchMock = vi.fn();
let warning: ReturnType<typeof vi.spyOn>;
let service: typeof import("@/lib/notifications/formsubmit");
const formUrl = "https://invitation.example/#rsvp";
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.stubGlobal("fetch", fetchMock);
  warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubEnv("FORMSUBMIT_RECIPIENT", "client@example.test");
  service = await import("@/lib/notifications/formsubmit");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("FormSubmit delivery", () => {
  it("sends only to the configured recipient with readable labels and the table template", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: "true" }) });
    expect(await service.sendFormSubmit(payload, "reply-id", service.getFormSubmitDestination()!, formUrl)).toEqual({ accepted: true });
    expect(fetchMock.mock.calls[0][0]).toBe("https://formsubmit.co/ajax/client%40example.test");
    const options = fetchMock.mock.calls[0][1]; const fields = JSON.parse(options.body);
    expect(options.headers.Referer).toBe(formUrl);
    expect(fields).toMatchObject({ _template: "table", _url: formUrl, Guest: "Guest", Attendance: "Joyfully accepts", "Budget per room per night": "USD 125", "Room sharing": "Private room", Reference: "reply-id", email: "guest@example.test" });
    expect(fields._subject).toContain("Shee Salamata & Don Vincent");
    expect(fields).not.toHaveProperty("_cc"); expect(fields).not.toHaveProperty("_autoresponse");
  });
  it("coalesces concurrent identical submissions on the same instance", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const replies = await Promise.all([service.sendFormSubmit(payload, "same-key", "client@example.test", formUrl), service.sendFormSubmit(payload, "same-key", "client@example.test", formUrl)]);
    expect(replies).toEqual([{ accepted: true }, { accepted: true }]); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not reuse an accepted key for changed details", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    await service.sendFormSubmit(payload, "same-key", "client@example.test", formUrl);
    expect(await service.sendFormSubmit({ ...payload, guestMessage: "Changed" }, "same-key", "client@example.test", formUrl)).toEqual({ accepted: false, status: 409, code: "submission_conflict" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("allows a retry after a provider failure instead of caching failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    expect(await service.sendFormSubmit(payload, "retry-key", "client@example.test", formUrl)).toEqual({ accepted: false, status: 503, code: "provider_unavailable" });
    expect(await service.sendFormSubmit(payload, "retry-key", "client@example.test", formUrl)).toEqual({ accepted: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it.each([{}, { success: false }, { success: "false", message: "Request rejected" }, { success: 1 }])("does not confirm an unsuccessful or malformed provider response %j", async body => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => body });
    expect(await service.sendFormSubmit(payload, "key", "client@example.test", formUrl)).toEqual({ accepted: false, status: 503, code: "provider_rejected" });
  });
  it.each([403, 429, 500])("does not report success for provider status %s", async status => {
    fetchMock.mockResolvedValue({ ok: false, status });
    expect(await service.sendFormSubmit(payload, "key", "client@example.test", formUrl)).toEqual({ accepted: false, status: status === 429 ? 429 : 503, code: status === 429 ? "rate_limited" : "provider_rejected" });
  });
  it("recognizes activation failures without exposing the provider message or recipient", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: "false", message: "This form needs Activation. Check client@example.test" }) });
    expect(await service.sendFormSubmit(payload, "activation-key", "client@example.test", formUrl)).toEqual({ accepted: false, status: 503, code: "activation_required" });
    const logged = JSON.stringify(warning.mock.calls);
    expect(logged).toContain("activation_required"); expect(logged).toContain("200");
    expect(logged).not.toContain("client@example.test"); expect(logged).not.toContain(payload.contact);
    expect(logged).not.toContain("This form needs");
  });
  it("distinguishes timeouts from an unreadable provider response", async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("private transport details"), { name: "TimeoutError" }));
    expect(await service.sendFormSubmit(payload, "timeout-key", "client@example.test", formUrl)).toEqual({ accepted: false, status: 503, code: "provider_timeout" });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new Error("not JSON"); } });
    expect(await service.sendFormSubmit(payload, "json-key", "client@example.test", formUrl)).toEqual({ accepted: false, status: 503, code: "invalid_provider_response" });
  });
  it("has a default client destination without credentials, and rejects invalid overrides", () => {
    vi.stubEnv("FORMSUBMIT_RECIPIENT", ""); expect(service.getFormSubmitDestination()).toMatch(/^[^@]+@gmail\.com$/);
    vi.stubEnv("FORMSUBMIT_RECIPIENT", "https://untrusted.example"); expect(service.getFormSubmitDestination()).toBeNull();
  });
  it("omits inactive accommodation details and never treats a phone as Reply-To email", () => {
    const decline = rsvpSchema.parse({ fullName: "Guest", contact: "+250 788 123 456", attendanceStatus: "declined", accommodationStatus: "not_applicable" });
    const fields = service.buildFormSubmitFields(decline, "key", formUrl);
    expect(fields.Attendance).toBe("Regretfully declines"); expect(fields).not.toHaveProperty("Accommodation");
    expect(fields).not.toHaveProperty("email"); expect(fields["Message for the couple"]).toBe("No message provided.");
  });
  it("keeps guest text as data without allowing it to override delivery fields", () => {
    const fields = service.buildFormSubmitFields({ ...payload, guestMessage: 'Love & joy, "_cc": "other@example.test"' }, "key", formUrl);
    expect(fields._template).toBe("table"); expect(fields).not.toHaveProperty("_cc");
    expect(fields["Message for the couple"]).toContain('"_cc"');
  });
});
