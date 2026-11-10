import { z } from "zod";

/** A handoff to FormSubmit's standard browser form, with its CAPTCHA enabled. */
export const formSubmitVerificationSchema = z.object({
  action: z.string().regex(/^https:\/\/formsubmit\.co\/[^/?#]+$/).refine(value => {
    try { return z.email().safeParse(decodeURIComponent(new URL(value).pathname.slice(1))).success; }
    catch { return false; }
  }),
  fields: z.record(z.string().min(1).max(100), z.string().max(2000)).refine(fields =>
    Object.keys(fields).length <= 25 && fields._template === "table"
    && typeof fields.Reference === "string"
    && !["_captcha", "_cc", "_autoresponse", "_next"].some(key => key in fields)),
});

export type FormSubmitVerification = z.infer<typeof formSubmitVerificationSchema>;

export function isRsvpSupportCode(value: unknown): value is string {
  return typeof value === "string" && /^FORM-[1-5]\d{2}-[a-z_]{1,40}$/.test(value);
}
