export const rsvpFailureMessages = {
  activation_required: "Online replies are awaiting confirmation from the hosts. Your details are still here. Please try again later or RSVP via WhatsApp.",
  provider_timeout: "The reply service is taking too long to respond. Your details are still here. Please try again or RSVP via WhatsApp.",
  provider_unavailable: "We couldn’t reach the reply service. Your details are still here. Please try again or RSVP via WhatsApp.",
  provider_rejected: "The reply service couldn’t accept your RSVP. Your details are still here. Please try again or RSVP via WhatsApp.",
  invalid_provider_response: "We couldn’t confirm your RSVP. Your details are still here. Please try again.",
  submission_conflict: "This reply’s reference has already been used with different details. Please reload the invitation before starting a new reply.",
  rate_limited: "A few replies have arrived at once. Please wait a moment and try again. Your details are still here.",
} as const;

export type RsvpFailureCode = keyof typeof rsvpFailureMessages;
export function isRsvpFailureCode(value: unknown): value is RsvpFailureCode {
  return typeof value === "string" && Object.hasOwn(rsvpFailureMessages, value);
}
