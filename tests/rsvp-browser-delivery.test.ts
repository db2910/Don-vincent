// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deliverFormSubmit } from "@/lib/notifications/formsubmit-browser";
const delivery = { action: "https://formsubmit.co/ajax/host%40example.test", fields: { Guest: "Guest", Reference: "same-reply", _template: "table", _captcha: "false" } };
const fetchMock = vi.fn();
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.unstubAllGlobals());
describe("browser FormSubmit delivery", () => {
  it.each([true, "true"])("confirms explicit provider success %s through browser AJAX", async success => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success }), { status: 200 }));
    expect(await deliverFormSubmit(delivery)).toEqual({ accepted: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(delivery.action, expect.objectContaining({ method: "POST", credentials: "omit", mode: "cors", body: JSON.stringify(delivery.fields) }));
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Referer");
  });
  it.each([{}, { success: false }, { success: "false" }, { success: 1 }])("does not confirm HTTP 200 alone: %j", async data => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));
    expect(await deliverFormSubmit(delivery)).toEqual({ accepted: false, code: "provider_rejected", supportCode: "FORM-200-provider_rejected" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([403, 429, 500])("reports a safe support code for HTTP %s", async status => {
    fetchMock.mockResolvedValue(new Response("Private upstream details", { status }));
    const code = status === 429 ? "rate_limited" : "provider_rejected";
    expect(await deliverFormSubmit(delivery)).toEqual({ accepted: false, code, supportCode: `FORM-${status}-${code}` });
  });
  it("recognizes activation without exposing the raw message", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: "false", message: "This form needs Activation. host@example.test" })));
    const result = await deliverFormSubmit(delivery);
    expect(result).toEqual({ accepted: false, code: "activation_required", supportCode: "FORM-200-activation_required" });
    expect(JSON.stringify(result)).not.toContain("host@example.test");
  });
  it("handles unreadable responses, timeouts and network errors without automatic resending", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not JSON"));
    expect(await deliverFormSubmit(delivery)).toMatchObject({ accepted: false, code: "invalid_provider_response" });
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("timeout"), { name: "TimeoutError" }));
    expect(await deliverFormSubmit(delivery)).toEqual({ accepted: false, code: "provider_timeout" });
    fetchMock.mockRejectedValueOnce(new TypeError("network"));
    expect(await deliverFormSubmit(delivery)).toEqual({ accepted: false, code: "provider_unavailable" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
