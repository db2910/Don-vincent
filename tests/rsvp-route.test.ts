// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { configMock, rateMock } = vi.hoisted(() => ({ configMock: vi.fn(), rateMock: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/notifications/formsubmit", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/notifications/formsubmit")>(), getFormSubmitDestination: configMock,
}));
vi.mock("@/lib/notifications/rate-limit", () => ({ checkRsvpRateLimit: rateMock }));
import { POST } from "@/app/api/rsvp/route";
import { formSubmitPreparationSchema } from "@/lib/validation/formsubmit";
const payload = { fullName: "Guest Example", contact: "guest@example.test", attendanceStatus: "accepted", accommodationStatus: "no" };
const key = "f9918d32-7358-4cd8-97df-9154e3c79868";
const fetchMock = vi.fn();
function request(body: unknown = payload, extraHeaders: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/rsvp", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json", "idempotency-key": key, ...extraHeaders }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000");
  configMock.mockReturnValue("host@example.test"); rateMock.mockReturnValue(0);
});
afterEach(() => { expect(fetchMock).not.toHaveBeenCalled(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("RSVP validation and preparation API", () => {
  it("fails safely for an invalid destination", async () => {
    configMock.mockReturnValue(null);
    const response = await POST(request()); expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("delivery");
  });
  it("handles Next's normalized local URL without trusting a different Origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    expect((await POST(request(payload, { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }))).status).toBe(200);
    expect((await POST(request(payload, { host: "127.0.0.1:3000", origin: "https://untrusted.test" }))).status).toBe(403);
  });
  it("rejects cross-origin input, invalid keys, honeypots, invalid data and recipient injection", async () => {
    expect((await POST(request(payload, { origin: "https://untrusted.test" }))).status).toBe(403);
    expect((await POST(request(payload, { "idempotency-key": "bad-key" }))).status).toBe(400);
    expect((await POST(request({ ...payload, website: "spam" }))).status).toBe(400);
    expect((await POST(request({ ...payload, fullName: "" }))).status).toBe(400);
    expect((await POST(request({ ...payload, recipient: "other@example.test" }))).status).toBe(400);
  });
  it("rejects unsupported formats and oversized streamed bodies", async () => {
    expect((await POST(request(payload, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(request({ message: "x".repeat(13_000) }))).status).toBe(413);
  });
  it("prepares validated fields without claiming email submission or calling FormSubmit", async () => {
    const response = await POST(request(payload, { "x-vercel-forwarded-for": "192.0.2.10" }));
    const data = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(formSubmitPreparationSchema.safeParse(data).success).toBe(true);
    expect(data).toMatchObject({ reference: key, delivery: {
      action: "https://formsubmit.co/ajax/host%40example.test", fields: { Guest: payload.fullName, Reference: key, Accommodation: "Own arrangements", _url: "http://localhost:3000/#rsvp" },
    } });
    expect(data).not.toHaveProperty("submitted"); expect(data.delivery.fields).not.toHaveProperty("Nights");
    expect(rateMock).toHaveBeenCalledWith("192.0.2.10");
  });
  it("throttles before preparing a sending endpoint", async () => {
    rateMock.mockReturnValue(120);
    const response = await POST(request()); expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("120");
    expect(await response.json()).not.toHaveProperty("delivery");
  });
});
