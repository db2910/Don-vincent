import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendPendingNotification } from "@/lib/notifications/rsvp";

export const runtime = "nodejs";

/** Call from a trusted scheduler with Authorization: Bearer <secret>. */
export async function POST(request: Request) {
  const secret = process.env.RSVP_NOTIFICATION_RETRY_SECRET;
  const provided = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  const received = Buffer.from(provided);
  if (!secret || received.byteLength !== expected.byteLength || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const providerAccepted = await sendPendingNotification();
    return NextResponse.json({ providerAccepted }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Notifications are temporarily unavailable." }, { status: 503 });
  }
}
