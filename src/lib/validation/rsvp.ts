import { z } from "zod";

const contact = z.string().trim().min(5, "Please enter an email address or phone number.").max(160)
  .refine((value) => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
    const digits = value.replace(/\D/g, "");
    return /^\+?[\d\s().-]{7,30}$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }, "Please enter a valid email address or phone number.");

export const guestSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  contact,
  attendanceStatus: z.enum(["accepted", "declined"], { error: "Please choose whether you can attend." }),
});

const accommodationShape = {
  accommodationStatus: z.enum(["yes", "no", "unsure", "not_applicable"], { error: "Please choose an accommodation option." }),
  budgetCurrency: z.enum(["USD", "RWF"]).nullable().default(null),
  budgetAmount: z.number({ error: "Please enter your preferred budget." }).finite().positive("Please enter a budget greater than zero.").nullable().default(null),
  nights: z.number({ error: "Please enter the number of nights." }).int("Please enter a whole number of nights.").positive("Please enter at least one night.").nullable().default(null),
  breakfastPreference: z.enum(["breakfast", "room_only", "no_preference"]).nullable().default(null),
  accommodationType: z.enum(["hotel", "apartment", "either"]).nullable().default(null),
  sharingPreference: z.enum(["private", "share", "own_group"]).nullable().default(null),
  roomOccupants: z.number({ error: "Please enter the number of guests sharing." }).int("Please enter a whole number of guests.").positive("Please enter at least one guest.").nullable().default(null),
};

type Accommodation = z.infer<z.ZodObject<typeof accommodationShape>>;
const detailFields = ["budgetCurrency", "budgetAmount", "nights", "breakfastPreference", "accommodationType", "sharingPreference", "roomOccupants"] as const;

function validateAccommodation(value: Accommodation, ctx: z.RefinementCtx) {
  for (const key of detailFields) {
    if (value.accommodationStatus === "yes" && value[key] == null) {
      ctx.addIssue({ code: "custom", path: [key], message: "Please choose or enter a value." });
    }
    if (value.accommodationStatus !== "yes" && value[key] != null) {
      ctx.addIssue({ code: "custom", path: [key], message: "Only include accommodation preferences when requesting accommodation." });
    }
  }
}

export const accommodationSchema = z.object(accommodationShape).superRefine(validateAccommodation);

export const rsvpSchema = guestSchema.extend({
  ...accommodationShape,
  guestMessage: z.string().trim().max(1200).default(""),
  website: z.string().max(200).default(""),
}).strict().superRefine((value, ctx) => {
  validateAccommodation(value, ctx);
  if (value.attendanceStatus === "declined" && value.accommodationStatus !== "not_applicable") {
    ctx.addIssue({ code: "custom", path: ["accommodationStatus"], message: "Accommodation does not apply when declining." });
  }
  if (value.attendanceStatus === "accepted" && value.accommodationStatus === "not_applicable") {
    ctx.addIssue({ code: "custom", path: ["accommodationStatus"], message: "Please choose an accommodation option." });
  }
});

export type RSVPPayload = z.infer<typeof rsvpSchema>;
