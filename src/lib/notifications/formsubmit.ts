import "server-only";
import { z } from "zod";
import type { RSVPPayload } from "@/lib/validation/rsvp";
import { experienceTitles } from "@/lib/experiences";
import { weddingConfig } from "@/lib/wedding-config";
import type { FormSubmitPreparation, FormSubmitVerification } from "@/lib/validation/formsubmit";
const labels: Record<string, string> = {
  accepted: "Joyfully accepts", declined: "Regretfully declines",
  yes: "Requested for planning", no: "Own arrangements",
  breakfast: "Bed and breakfast", room_only: "Room only — no breakfast",
  hotel: "Hotel", apartment: "Apartment",
  private: "Private room", share: "Happy to share if needed",
};

/** Owner-inbox delivery was confirmed before restoring the client's recipient.
 * FORMSUBMIT_RECIPIENT overrides the default on each host. */
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
    "Celebration": "Wedding · 17 December 2026 · Kigali",
    "Guest": payload.fullName,
    "Phone or email": payload.contact,
    "Attendance": labels[payload.attendanceStatus],
  };
  // FormSubmit recognizes the email field for Reply-To; a phone is never used as email.
  if (z.email().safeParse(payload.contact).success) fields.email = payload.contact;
  if (payload.attendanceStatus === "accepted") {
    fields["Rwanda experiences"] = experienceTitles(payload.experiences).join(", ") || "None selected";
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

/** Preparation does not send an email. The browser uses FormSubmit's documented
 * AJAX flow, avoiding the server-to-server request rejected by the provider. */
export function prepareFormSubmit(payload: RSVPPayload, reference: string, destination: string, formUrl: string): FormSubmitPreparation {
  return {
    reference,
    delivery: { action: `https://formsubmit.co/ajax/${encodeURIComponent(destination)}`, fields: buildFormSubmitFields(payload, reference, formUrl) },
    verification: buildFormSubmitVerification(payload, reference, destination, formUrl),
  };
}
