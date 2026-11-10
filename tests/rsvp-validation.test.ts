import { describe, expect, it } from "vitest";
import { accommodationSchema, guestSchema, rsvpSchema } from "@/lib/validation/rsvp";
import { formSubmitVerificationSchema, isRsvpSupportCode } from "@/lib/validation/formsubmit";

const guest = { fullName: "Guest Example", contact: "guest@example.test", attendanceStatus: "accepted" };
const details = {
  accommodationStatus: "yes", budgetCurrency: "USD", budgetAmount: 100, nights: 2,
  breakfastPreference: "breakfast", accommodationType: "hotel", sharingPreference: "private", roomOccupants: 2,
};

describe("shared RSVP validation", () => {
  it("accepts an email or phone contact and trims the name", () => {
    expect(guestSchema.parse({ ...guest, fullName: "  Guest Example  " }).fullName).toBe("Guest Example");
    expect(guestSchema.safeParse({ ...guest, contact: "+250 788 123 456" }).success).toBe(true);
    expect(guestSchema.safeParse({ ...guest, contact: "missing contact" }).success).toBe(false);
    expect(guestSchema.safeParse({ ...guest, contact: "......." }).success).toBe(false);
    expect(guestSchema.safeParse({ ...guest, contact: "+1234567890123456" }).success).toBe(false);
  });

  it("requires every accommodation preference when accommodation is requested", () => {
    expect(accommodationSchema.safeParse(details).success).toBe(true);
    expect(accommodationSchema.safeParse({ ...details, nights: null }).success).toBe(false);
    expect(accommodationSchema.safeParse({ ...details, budgetAmount: -10 }).success).toBe(false);
    expect(accommodationSchema.safeParse({ ...details, roomOccupants: 1.5 }).success).toBe(false);
  });

  it("requires empty preference fields for no and unsure", () => {
    expect(accommodationSchema.safeParse({ accommodationStatus: "unsure" }).success).toBe(true);
    expect(accommodationSchema.safeParse({ ...details, accommodationStatus: "no" }).success).toBe(false);
  });

  it("does not invent hotel price ceilings, stay limits or room limits", () => {
    expect(accommodationSchema.safeParse({ ...details, budgetAmount: 200_000_000, nights: 45, roomOccupants: 25 }).success).toBe(true);
  });

  it("enforces the decline branch at final submission", () => {
    expect(rsvpSchema.safeParse({ ...guest, attendanceStatus: "declined", accommodationStatus: "not_applicable" }).success).toBe(true);
    expect(rsvpSchema.safeParse({ ...guest, ...details, attendanceStatus: "declined" }).success).toBe(false);
    expect(rsvpSchema.safeParse({ ...guest, accommodationStatus: "not_applicable" }).success).toBe(false);
  });

  it("limits free text and rejects additional submitted fields", () => {
    expect(rsvpSchema.safeParse({ ...guest, ...details, guestMessage: "x".repeat(1201) }).success).toBe(false);
    expect(rsvpSchema.safeParse({ ...guest, ...details, isAdmin: true }).success).toBe(false);
    expect(rsvpSchema.parse({ ...guest, ...details }).website).toBe("");
  });
  it("accepts only the FormSubmit recipient endpoint with browser verification enabled", () => {
    const handoff = { action: "https://formsubmit.co/host%40example.test", fields: { _template: "table", Reference: "key", Guest: "Guest" } };
    expect(formSubmitVerificationSchema.safeParse(handoff).success).toBe(true);
    for (const action of ["https://untrusted.example/host", "https://formsubmit.co.evil.example/host", "javascript:alert(1)", "https://formsubmit.co/ajax/host@example.test", "https://formsubmit.co/not-an-email"]) {
      expect(formSubmitVerificationSchema.safeParse({ ...handoff, action }).success).toBe(false);
    }
    expect(formSubmitVerificationSchema.safeParse({ ...handoff, fields: { ...handoff.fields, _captcha: "false" } }).success).toBe(false);
    expect(formSubmitVerificationSchema.safeParse({ ...handoff, fields: { ...handoff.fields, _cc: "other@example.test" } }).success).toBe(false);
  });
  it("allows only a bounded support code rather than arbitrary provider text", () => {
    expect(isRsvpSupportCode("FORM-403-provider_rejected")).toBe(true);
    expect(isRsvpSupportCode("Private details: host@example.test")).toBe(false);
    expect(isRsvpSupportCode("FORM-403-" + "x".repeat(100))).toBe(false);
  });
});
