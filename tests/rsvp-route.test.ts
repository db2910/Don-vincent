// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { configMock, sendMock, rateMock } = vi.hoisted(() => ({ configMock: vi.fn(), sendMock: vi.fn(), rateMock: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/notifications/formsubmit", () => ({ getFormSubmitDestination: configMock, sendFormSubmit: sendMock }));
vi.mock("@/lib/notifications/rate-limit", () => ({ checkRsvpRateLimit: rateMock }));
import { POST } from "@/app/api/rsvp/route";
const payload = { fullName: "Guest Example", contact: "guest@example.test", attendanceStatus: "accepted", accommodationStatus: "no" };
const key = "f9918d32-7358-4cd8-97df-9154e3c79868";
const config = "host@example.test";
function request(body: unknown = payload, extraHeaders: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/rsvp", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json", "idempotency-key": key, ...extraHeaders }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000");
  configMock.mockReturnValue(config); sendMock.mockResolvedValue({ accepted: true }); rateMock.mockReturnValue(0);
});
afterEach(() => vi.unstubAllEnvs());
describe("email-only RSVP API", () => {
  it("fails safely for an invalid destination without pretending to preview", async () => {
    configMock.mockReturnValue(null);
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("mode");
    expect(sendMock).not.toHaveBeenCalled();
  });
  it("handles Next's normalized local URL without trusting a different Origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    expect((await POST(request(payload, { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }))).status).toBe(200);
    expect((await POST(request(payload, { host: "127.0.0.1:3000", origin: "https://untrusted.test" }))).status).toBe(403);
  });
  it("does not accept live submissions when production email is invalid", async () => {
    vi.stubEnv("NODE_ENV", "production"); configMock.mockReturnValue(null); const response = await POST(request());
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('"submitted":true');
  });
  it("rejects cross-origin input, invalid keys, honeypots and invalid guest data before sending", async () => {
    expect((await POST(request(payload, { origin: "https://untrusted.test" }))).status).toBe(403);
    expect((await POST(request(payload, { "idempotency-key": "bad-key" }))).status).toBe(400);
    expect((await POST(request({ ...payload, website: "spam" }))).status).toBe(400);
    expect((await POST(request({ ...payload, fullName: "" }))).status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });
  it("rejects unsupported formats and oversized streamed bodies", async () => {
    expect((await POST(request(payload, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(request({ message: "x".repeat(13_000) }))).status).toBe(413);
  });
  it("confirms only provider acceptance, using validated fields and the same retry key", async () => {
    configMock.mockReturnValue(config);
    const response = await POST(request(payload, { "x-vercel-forwarded-for": "192.0.2.10" }));
    expect(await response.json()).toEqual({ submitted: true, reference: key });
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining(payload), key, config, "http://localhost:3000/#rsvp");
    expect(rateMock).toHaveBeenCalledWith("192.0.2.10");
    expect(sendMock.mock.calls[0][0].budgetAmount).toBeNull();
  });
  it("throttles before calling the provider", async () => {
    configMock.mockReturnValue(config); rateMock.mockReturnValue(120);
    const response = await POST(request()); expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("120"); expect(sendMock).not.toHaveBeenCalled();
  });
  it.each([409, 429, 503])("does not report success for provider status %s", async (status) => {
    configMock.mockReturnValue(config); sendMock.mockResolvedValue({ accepted: false, status, code: status === 409 ? "submission_conflict" : status === 429 ? "rate_limited" : "provider_unavailable" });
    const response = await POST(request()); expect(response.status).toBe(status);
    expect(await response.text()).not.toContain('"submitted":true');
  });
  it("returns a safe activation code and message rather than false success", async () => {
    sendMock.mockResolvedValue({ accepted: false, status: 503, code: "activation_required" });
    const response = await POST(request()); const data = await response.json();
    expect(response.status).toBe(503); expect(data.code).toBe("activation_required");
    expect(data.error).toContain("awaiting confirmation from the hosts");
    expect(data).not.toHaveProperty("submitted");
  });
  it("returns a generic error if sending throws", async () => {
    configMock.mockReturnValue(config); sendMock.mockRejectedValue(new Error("sensitive provider details"));
    const response = await POST(request()); expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("sensitive");
  });
});
