import { z } from "zod";

const fieldsSchema = z.record(z.string().min(1).max(100), z.string().max(2000)).refine(fields =>
  Object.keys(fields).length <= 25 && fields._template === "table"
  && typeof fields.Reference === "string"
  && !["_cc", "_autoresponse", "_next"].some(key => key in fields));

function isRecipientEndpoint(value: string, ajax: boolean): boolean {
  try {
    const url = new URL(value);
    const path = ajax ? url.pathname.slice(6) : url.pathname.slice(1);
    return z.email().safeParse(decodeURIComponent(path)).success;
  } catch { return false; }
}

/** A handoff to FormSubmit's standard browser form, with its CAPTCHA enabled. */
export const formSubmitVerificationSchema = z.object({
  action: z.string().regex(/^https:\/\/formsubmit\.co\/[^/?#]+$/).refine(value => isRecipientEndpoint(value, false)),
  fields: fieldsSchema.refine(fields => !("_captcha" in fields)),
});

export type FormSubmitVerification = z.infer<typeof formSubmitVerificationSchema>;

export const formSubmitDeliverySchema = z.object({
  action: z.string().regex(/^https:\/\/formsubmit\.co\/ajax\/[^/?#]+$/).refine(value => isRecipientEndpoint(value, true)),
  fields: fieldsSchema.refine(fields => fields._captcha === "false"),
});
export type FormSubmitDelivery = z.infer<typeof formSubmitDeliverySchema>;

export const formSubmitPreparationSchema = z.object({
  reference: z.uuid(), delivery: formSubmitDeliverySchema, verification: formSubmitVerificationSchema,
}).refine(value => value.delivery.action.replace("/ajax/", "/") === value.verification.action
  && value.delivery.fields.Reference === value.reference && value.verification.fields.Reference === value.reference);
export type FormSubmitPreparation = z.infer<typeof formSubmitPreparationSchema>;

export function isRsvpSupportCode(value: unknown): value is string {
  return typeof value === "string" && /^FORM-[1-5]\d{2}-[a-z_]{1,40}$/.test(value);
}
