import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { RSVPPayload } from "@/lib/validation/rsvp";
import { weddingConfig } from "@/lib/wedding-config";

type Result = { accepted: true } | { accepted: false; status: 409 | 429 | 503 };
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

async function deliver(destination: string, fields: Record<string, string>, formUrl: string): Promise<Result> {
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destination)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Referer: formUrl },
      body: JSON.stringify(fields),
      signal: AbortSignal.timeout(12_000),
      redirect: "error",
    });
    if (response.status === 429) return { accepted: false, status: 429 };
    if (!response.ok) return { accepted: false, status: 503 };
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "success" in data
      && (data.success === true || data.success === "true")) return { accepted: true };
  } catch {
    // Never log guest data or raw provider replies, and never imply inbox delivery.
  }
  return { accepted: false, status: 503 };
}

/** Coalesces retries on this instance only. FormSubmit has no documented global
 * idempotency guarantee; the stable Reference lets hosts recognize duplicates. */
export async function sendFormSubmit(payload: RSVPPayload, reference: string, destination: string, formUrl: string): Promise<Result> {
  const now = Date.now();
  for (const [key, entry] of submissions) if (entry.expires <= now) submissions.delete(key);
  const fields = buildFormSubmitFields(payload, reference, formUrl);
  const fingerprint = createHash("sha256").update(JSON.stringify([destination, fields])).digest("hex");
  const existing = submissions.get(reference);
  if (existing) return existing.fingerprint === fingerprint ? existing.result : { accepted: false, status: 409 };
  if (submissions.size >= MAX_SUBMISSIONS) return { accepted: false, status: 503 };
  const result = deliver(destination, fields, formUrl);
  submissions.set(reference, { fingerprint, expires: now + RETENTION_MS, result });
  const response = await result;
  if (!response.accepted) submissions.delete(reference);
  return response;
}
