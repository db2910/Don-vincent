import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { RSVPPayload } from "@/lib/validation/rsvp";
import { weddingConfig } from "@/lib/wedding-config";
import type { RsvpFailureCode } from "@/lib/rsvp-errors";
import type { FormSubmitVerification } from "@/lib/validation/formsubmit";

type Result = { accepted: true } | { accepted: false; status: 409 | 429 | 503; code: RsvpFailureCode; supportCode?: string };
const RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_SUBMISSIONS = 2000;
const submissions = new Map<string, { fingerprint: string; expires: number; result: Promise<Result> }>();
const labels: Record<string, string> = {
  accepted: "Joyfully accepts", declined: "Regretfully declines",
  yes: "Requested for planning", no: "Own arrangements", unsure: "Not sure yet",
  breakfast: "Bed and breakfast", room_only: "Room only — no breakfast", no_preference: "No preference",
  hotel: "Hotel", apartment: "Apartment", either: "Either is fine",
  private: "Private room", share: "Happy to share if needed", own_group: "Sharing with own group",
};

/** The recipient stays on the server. No API key, test inbox or domain is needed. */
export function getFormSubmitDestination(): string | null {
  const recipient = process.env.FORMSUBMIT_RECIPIENT?.trim() || "nshimiye003@gmail.com";
  return z.email().safeParse(recipient).success ? recipient : null;
}

export function buildFormSubmitFields(payload: RSVPPayload, reference: string, formUrl: string): Record<string, string> {
  const fields: Record<string, string> = {
    _subject: `Wedding RSVP · ${weddingConfig.names.combined}`,
    _template: "table",
    _captcha: "false", // AJAX stays on the invitation; the route retains its abuse guard.
    _honey: "",
    _url: formUrl,
    "Celebration": "Civil Wedding · 17 December 2026 · Kigali",
    "Guest": payload.fullName,
    "Phone or email": payload.contact,
    "Attendance": labels[payload.attendanceStatus],
  };
  // FormSubmit recognizes the email field for Reply-To; a phone is never used as email.
  if (z.email().safeParse(payload.contact).success) fields.email = payload.contact;
  if (payload.attendanceStatus === "accepted") {
    fields.Accommodation = labels[payload.accommodationStatus];
    if (payload.accommodationStatus === "yes") Object.assign(fields, {
      "Budget per room per night": `${payload.budgetCurrency} ${payload.budgetAmount?.toLocaleString("en-US", { maximumSignificantDigits: 21 })}`,
      "Nights": String(payload.nights),
      "Breakfast": labels[payload.breakfastPreference!],
      "Preferred stay": labels[payload.accommodationType!],
      "Room sharing": labels[payload.sharingPreference!],
      "People in room, including guest": String(payload.roomOccupants),
      "Accommodation note": "Planning preferences only. No room has been booked.",
    });
  }
  fields["Message for the couple"] = payload.guestMessage || "No message provided.";
  fields.Reference = reference;
  return fields;
}

export function buildFormSubmitVerification(payload: RSVPPayload, reference: string, destination: string, formUrl: string): FormSubmitVerification {
  const fields = buildFormSubmitFields(payload, reference, formUrl);
  // Standard browser POST allows FormSubmit to show its own security check.
  // Keep its real confirmation page rather than implying success in this app.
  delete fields._captcha;
  return { action: `https://formsubmit.co/${encodeURIComponent(destination)}`, fields };
}

function failure(code: RsvpFailureCode, status: 409 | 429 | 503, providerStatus?: number): Result {
  // Fixed categories and HTTP status only. No addresses, guest input or raw
  // provider messages are logged or returned to guests.
  console.warn("RSVP provider failure", { provider: "formsubmit", code, ...(providerStatus !== undefined ? { providerStatus } : {}) });
  const supportCode = typeof providerStatus === "number" && Number.isInteger(providerStatus) && providerStatus >= 100 && providerStatus <= 599
    ? `FORM-${providerStatus}-${code}` : undefined;
  return { accepted: false, status, code, ...(supportCode ? { supportCode } : {}) };
}

async function deliver(destination: string, fields: Record<string, string>, formUrl: string): Promise<Result> {
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destination)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Referer: formUrl },
      body: JSON.stringify(fields),
      signal: AbortSignal.timeout(12_000),
      redirect: "error",
    });
    if (response.status === 429) return failure("rate_limited", 429, response.status);
    if (!response.ok) return failure("provider_rejected", 503, response.status);
    let data: unknown;
    try { data = await response.json(); }
    catch { return failure("invalid_provider_response", 503, response.status); }
    if (typeof data === "object" && data !== null && "success" in data
      && (data.success === true || data.success === "true")) return { accepted: true };
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
      && /activat(?:e|ion)/i.test(data.message)) return failure("activation_required", 503, response.status);
    return failure("provider_rejected", 503, response.status);
  } catch (error) {
    return failure(error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "provider_timeout" : "provider_unavailable", 503);
  }
}

/** Coalesces retries on this instance only. FormSubmit has no documented global
 * idempotency guarantee; the stable Reference lets hosts recognize duplicates. */
export async function sendFormSubmit(payload: RSVPPayload, reference: string, destination: string, formUrl: string): Promise<Result> {
  const now = Date.now();
  for (const [key, entry] of submissions) if (entry.expires <= now) submissions.delete(key);
  const fields = buildFormSubmitFields(payload, reference, formUrl);
  const fingerprint = createHash("sha256").update(JSON.stringify([destination, fields])).digest("hex");
  const existing = submissions.get(reference);
  if (existing) return existing.fingerprint === fingerprint ? existing.result : { accepted: false, status: 409, code: "submission_conflict" };
  if (submissions.size >= MAX_SUBMISSIONS) return { accepted: false, status: 503, code: "provider_unavailable" };
  const result = deliver(destination, fields, formUrl);
  submissions.set(reference, { fingerprint, expires: now + RETENTION_MS, result });
  const response = await result;
  if (!response.accepted) submissions.delete(reference);
  return response;
}
