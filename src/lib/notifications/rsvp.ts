import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type NotificationJob = {
  id: string;
  rsvp_id: string;
  claim_attempt: number;
  full_name: string;
  contact: string;
  attendance_status: string;
  accommodation_status: string;
  budget_currency: string | null;
  budget_amount: number | string | null;
  nights: number | null;
  breakfast_preference: string | null;
  accommodation_type: string | null;
  sharing_preference: string | null;
  room_occupants: number | null;
  guest_message: string;
};

/** Claims are atomic; failed delivery never changes the saved RSVP. */
export async function sendPendingNotification(rsvpId?: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RSVP_NOTIFICATION_FROM;
  const to = process.env.RSVP_NOTIFICATION_TO;
  if (!db || !apiKey || !from || !to) return false;

  const { data, error } = await db.rpc("claim_rsvp_notification", { p_rsvp_id: rsvpId ?? null });
  const job = (data as NotificationJob[] | null)?.[0];
  if (error || !job) return false;

  let accepted = false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `wedding-rsvp-${job.rsvp_id}`,
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((address) => address.trim()).filter(Boolean),
        subject: "A wedding RSVP has been received",
        text: [
          "A guest has submitted a wedding RSVP.",
          `Guest: ${job.full_name}`,
          `Contact: ${job.contact}`,
          `Attendance: ${job.attendance_status}`,
          `Accommodation: ${job.accommodation_status}`,
          ...(job.accommodation_status === "yes" ? [
            `Budget per room per night: ${job.budget_currency} ${job.budget_amount}`,
            `Nights: ${job.nights}`,
            `Breakfast: ${job.breakfast_preference}`,
            `Preferred stay: ${job.accommodation_type}`,
            `Room sharing: ${job.sharing_preference}`,
            `People in room, including guest: ${job.room_occupants}`,
            "These are planning preferences, not a confirmed accommodation booking.",
          ] : []),
          `Message for the couple: ${job.guest_message || "No message provided."}`,
          `Record: ${job.rsvp_id}`,
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const result: unknown = await response.json();
      accepted = typeof result === "object" && result !== null && "id" in result
        && typeof result.id === "string" && result.id.trim().length > 0;
    }
  } catch {
    // No guest data, provider responses, or credentials are written to logs.
  }

  await db.rpc("finish_rsvp_notification", { p_id: job.id, p_attempt: job.claim_attempt, p_accepted: accepted });
  return accepted;
}
