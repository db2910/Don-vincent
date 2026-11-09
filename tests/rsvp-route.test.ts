// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, notificationMock, rpc } = vi.hoisted(() => ({ dbMock: vi.fn(), notificationMock: vi.fn(), rpc: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: dbMock }));
vi.mock("@/lib/notifications/rsvp", () => ({ sendPendingNotification: notificationMock }));
import { POST } from "@/app/api/rsvp/route";

const payload = {
  fullName: "Guest Example", contact: "guest@example.test", attendanceStatus: "accepted", accommodationStatus: "no",
};
const key = "f9918d32-7358-4cd8-97df-9154e3c79868";
function request(body: unknown = payload, extraHeaders: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/rsvp", {
    method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json", "idempotency-key": key, ...extraHeaders },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "http://localhost:3000");
  vi.stubEnv("RSVP_RATE_LIMIT_SECRET", "test-only-secret");
  dbMock.mockReturnValue(null);
  notificationMock.mockResolvedValue(false);
});
afterEach(() => vi.unstubAllEnvs());

describe("RSVP API", () => {
  it("honestly reports local preview without database writes or delivery", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ mode: "preview", stored: false });
    expect(notificationMock).not.toHaveBeenCalled();
  });

  it("uses the browser host when Next normalizes an unconfigured local request URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    const response = await POST(request(payload, { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ mode: "preview", stored: false });
    expect((await POST(request(payload, { host: "127.0.0.1:3000", origin: "https://untrusted.test" }))).status).toBe(403);
    vi.stubEnv("NODE_ENV", "production");
    expect((await POST(request(payload, { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }))).status).toBe(503);
  });

  it("fails safely when production persistence is unconfigured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('"stored":true');
  });

  it("rejects cross-origin requests, invalid keys, honeypots and invalid data", async () => {
    expect((await POST(request(payload, { origin: "https://untrusted.test" }))).status).toBe(403);
    expect((await POST(request(payload, { "idempotency-key": "bad-key" }))).status).toBe(400);
    expect((await POST(request({ ...payload, website: "spam" }))).status).toBe(400);
    expect((await POST(request({ ...payload, fullName: "" }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects unsupported formats and oversized streamed bodies", async () => {
    expect((await POST(request(payload, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(request({ message: "x".repeat(13_000) }))).status).toBe(413);
  });

  it("persists through one atomic RPC before attempting notification", async () => {
    dbMock.mockReturnValue({ rpc });
    rpc.mockResolvedValue({ data: { status: "saved", id: key }, error: null });
    const response = await POST(request(payload, { "x-vercel-forwarded-for": "192.0.2.10" }));
    expect(await response.json()).toEqual({ stored: true, id: key });
    expect(rpc).toHaveBeenCalledWith("submit_wedding_rsvp", expect.objectContaining({ p_idempotency_key: key, p_rate_key: expect.stringMatching(/^[a-f0-9]{64}$/), p_payload_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(rpc.mock.calls[0][1].p_payload).not.toHaveProperty("website");
    expect(notificationMock).toHaveBeenCalledWith(key);
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(notificationMock.mock.invocationCallOrder[0]);
  });

  it("keeps persistence success when notification fails", async () => {
    dbMock.mockReturnValue({ rpc });
    rpc.mockResolvedValue({ data: { status: "saved", id: key }, error: null });
    notificationMock.mockRejectedValue(new Error("provider failed"));
    const response = await POST(request());
    expect(await response.json()).toEqual({ stored: true, id: key });
  });

  it.each([["rate_limited", 429], ["conflict", 409]])("handles distributed %s without sending email", async (status, expected) => {
    dbMock.mockReturnValue({ rpc });
    rpc.mockResolvedValue({ data: { status }, error: null });
    const response = await POST(request());
    expect(response.status).toBe(expected);
    expect(notificationMock).not.toHaveBeenCalled();
  });

  it("returns only a generic database error", async () => {
    dbMock.mockReturnValue({ rpc });
    rpc.mockResolvedValue({ data: null, error: { message: "sensitive internal error" } });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("sensitive");
  });
});
