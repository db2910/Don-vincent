import type { FormSubmitDelivery } from "@/lib/validation/formsubmit";
import type { RsvpFailureCode } from "@/lib/rsvp-errors";

type Result = { accepted: true } | { accepted: false; code: RsvpFailureCode; supportCode?: string };

function failure(code: RsvpFailureCode, status?: number): Result {
  return { accepted: false, code, ...(status && status >= 100 && status <= 599
    ? { supportCode: `FORM-${status}-${code}` } : {}) };
}

/** Browser-to-FormSubmit AJAX. No cookies, invented Referer or success based on
 * HTTP status alone. Guest input and raw provider messages are never logged. */
export async function deliverFormSubmit(delivery: FormSubmitDelivery): Promise<Result> {
  try {
    const response = await fetch(delivery.action, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(delivery.fields), credentials: "omit", mode: "cors",
      signal: AbortSignal.timeout(12_000), redirect: "error",
    });
    if (response.status === 429) return failure("rate_limited", response.status);
    if (!response.ok) return failure("provider_rejected", response.status);
    let data: unknown;
    try { data = await response.json(); }
    catch { return failure("invalid_provider_response", response.status); }
    if (typeof data === "object" && data !== null && "success" in data
      && (data.success === true || data.success === "true")) return { accepted: true };
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
      && /activat(?:e|ion)/i.test(data.message)) return failure("activation_required", response.status);
    return failure("provider_rejected", response.status);
  } catch (error) {
    return failure(error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
      ? "provider_timeout" : "provider_unavailable");
  }
}
