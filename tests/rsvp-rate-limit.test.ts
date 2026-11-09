// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-10T10:00:00Z")); });
afterEach(() => vi.useRealTimers());
it("limits one address without blocking another and expires the window", async () => {
  const { checkRsvpRateLimit } = await import("@/lib/notifications/rate-limit");
  for (let i = 0; i < 8; i++) expect(checkRsvpRateLimit("192.0.2.1")).toBe(0);
  expect(checkRsvpRateLimit("192.0.2.1")).toBe(600);
  expect(checkRsvpRateLimit("192.0.2.2")).toBe(0);
  vi.advanceTimersByTime(600_000); expect(checkRsvpRateLimit("192.0.2.1")).toBe(0);
});
it("fails closed at capacity instead of dropping active limits", async () => {
  const { checkRsvpRateLimit } = await import("@/lib/notifications/rate-limit");
  for (let i = 0; i < 2000; i++) expect(checkRsvpRateLimit(`address-${i}`)).toBe(0);
  expect(checkRsvpRateLimit("overflow")).toBe(60);
  vi.advanceTimersByTime(600_000); expect(checkRsvpRateLimit("overflow")).toBe(0);
});
