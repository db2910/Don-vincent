// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { rpc, dbMock } = vi.hoisted(() => ({ rpc: vi.fn(), dbMock: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: dbMock }));
import { sendPendingNotification } from "@/lib/notifications/rsvp";
import { POST as retry } from "@/app/api/notifications/retry/route";
const job = {
  id: "outbox-id", rsvp_id: "rsvp-id", claim_attempt: 1, full_name: "Guest", contact: "guest@example.test", attendance_status: "accepted", accommodation_status: "yes",
  budget_currency: "USD", budget_amount: 125, nights: 2, breakfast_preference: "breakfast", accommodation_type: "hotel", sharing_preference: "private", room_occupants: 2, guest_message: "See you there!",
};
const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("RESEND_API_KEY", "test-only");
  vi.stubEnv("RSVP_NOTIFICATION_FROM", "host@example.test");
  vi.stubEnv("RSVP_NOTIFICATION_TO", "host@example.test");
  vi.stubEnv("RSVP_NOTIFICATION_RETRY_SECRET", "test-retry-secret");
  dbMock.mockReturnValue({ rpc });
  rpc.mockImplementation((name: string) => Promise.resolve({ data: name === "claim_rsvp_notification" ? [job] : null, error: null }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("queued notifications", () => {
  it("sends only a claimed job with a stable provider idempotency key", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "provider-message-id" }) });
    expect(await sendPendingNotification("rsvp-id")).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "wedding-rsvp-rsvp-id" }) }));
    const email = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(email.text).toContain("Budget per room per night: USD 125");
    expect(email.text).toContain("See you there!");
    expect(rpc).toHaveBeenLastCalledWith("finish_rsvp_notification", { p_id: "outbox-id", p_attempt: 1, p_accepted: true });
  });

  it("keeps failed deliveries retryable without submitting another RSVP", async () => {
    fetchMock.mockRejectedValue(new Error("network timeout"));
    expect(await sendPendingNotification()).toBe(false);
    expect(rpc).toHaveBeenLastCalledWith("finish_rsvp_notification", { p_id: "outbox-id", p_attempt: 1, p_accepted: false });
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(["claim_rsvp_notification", "finish_rsvp_notification"]);
  });

  it("does not send without configuration or an eligible claim", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await sendPendingNotification()).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    vi.stubEnv("RESEND_API_KEY", "test-only");
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await sendPendingNotification()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("protects retry calls with a server-only bearer secret", async () => {
    const response = await retry(new Request("http://localhost/api/notifications/retry", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "provider-message-id" }) });
    const authorized = await retry(new Request("http://localhost/api/notifications/retry", { method: "POST", headers: { authorization: "Bearer test-retry-secret" } }));
    expect(authorized.status).toBe(200);
    expect(await authorized.json()).toEqual({ providerAccepted: true });
  });

  it.each([{}, { id: "" }, { id: 123 }])("does not record provider acceptance for a malformed success body", async (body) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => body });
    expect(await sendPendingNotification()).toBe(false);
    expect(rpc).toHaveBeenLastCalledWith("finish_rsvp_notification", { p_id: "outbox-id", p_attempt: 1, p_accepted: false });
  });
});
