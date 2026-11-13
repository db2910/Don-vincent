// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { rsvpSchema } from "@/lib/validation/rsvp";
import { formSubmitPreparationSchema } from "@/lib/validation/formsubmit";
import { buildFormSubmitFields, getFormSubmitDestination, prepareFormSubmit } from "@/lib/notifications/formsubmit";
const payload = rsvpSchema.parse({ fullName: "Guest", contact: "guest@example.test", attendanceStatus: "accepted", accommodationStatus: "yes", budgetCurrency: "USD", budgetAmount: 125, nights: 2, breakfastPreference: "breakfast", accommodationType: "hotel", sharingPreference: "private", roomOccupants: 2, guestMessage: "See you there!" });
const formUrl = "https://invitation.example/#rsvp";
const reference = "f9918d32-7358-4cd8-97df-9154e3c79868";
beforeEach(() => vi.stubEnv("FORMSUBMIT_RECIPIENT", "client@example.test"));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("FormSubmit preparation", () => {
  it("includes readable experience choices in both delivery and verification", () => {
    const prepared = prepareFormSubmit({ ...payload, experiences: ["lake_kivu", "nyungwe_canopy"] }, reference, "client@example.test", formUrl);
    expect(formSubmitPreparationSchema.safeParse(prepared).success).toBe(true);
    for (const handoff of [prepared.delivery, prepared.verification]) {
      expect(handoff.fields["Rwanda experiences"]).toBe("Lake Kivu escape, Nyungwe canopy walk");
      expect(handoff.fields.Celebration).not.toMatch(/civil/i);
    }
  });
  it("prepares matching AJAX and CAPTCHA endpoints without a server email request", () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const prepared = prepareFormSubmit(payload, reference, getFormSubmitDestination()!, formUrl);
    expect(formSubmitPreparationSchema.safeParse(prepared).success).toBe(true);
    expect(prepared.delivery.action).toBe("https://formsubmit.co/ajax/client%40example.test");
    expect(prepared.verification.action).toBe("https://formsubmit.co/client%40example.test");
    expect(prepared.delivery.fields).toMatchObject({ _template: "table", _url: formUrl, Guest: "Guest", Attendance: "Joyfully accepts", "Budget per room per night": "USD 125", "Room sharing": "Private room", Reference: reference, email: "guest@example.test", _captcha: "false" });
    expect(prepared.delivery.fields._subject).toContain("Shee Salamata & Don Vincent");
    expect(prepared.verification.fields).not.toHaveProperty("_captcha");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("defaults to the restored client inbox and allows an explicit testing override", () => {
    vi.stubEnv("FORMSUBMIT_RECIPIENT", ""); expect(getFormSubmitDestination()).toBe("nshimiye003@gmail.com");
    vi.stubEnv("FORMSUBMIT_RECIPIENT", "donkyleben@gmail.com"); expect(getFormSubmitDestination()).toBe("donkyleben@gmail.com");
    vi.stubEnv("FORMSUBMIT_RECIPIENT", "https://untrusted.example"); expect(getFormSubmitDestination()).toBeNull();
  });
  it("omits inactive accommodation details and never treats a phone as Reply-To email", () => {
    const decline = rsvpSchema.parse({ fullName: "Guest", contact: "+250 788 123 456", attendanceStatus: "declined", accommodationStatus: "not_applicable" });
    const fields = buildFormSubmitFields(decline, reference, formUrl);
    expect(fields.Attendance).toBe("Regretfully declines"); expect(fields).not.toHaveProperty("Accommodation");
    expect(fields).not.toHaveProperty("email"); expect(fields["Message for the couple"]).toBe("No message provided.");
  });
  it("keeps guest text from overriding delivery fields", () => {
    const prepared = prepareFormSubmit({ ...payload, guestMessage: 'Love & joy, "_cc": "other@example.test"' }, reference, "client@example.test", formUrl);
    for (const handoff of [prepared.delivery, prepared.verification]) {
      expect(handoff.fields._template).toBe("table");
      for (const key of ["_cc", "_autoresponse", "_next"]) expect(handoff.fields).not.toHaveProperty(key);
      expect(handoff.fields["Message for the couple"]).toContain('"_cc"');
    }
  });
});
