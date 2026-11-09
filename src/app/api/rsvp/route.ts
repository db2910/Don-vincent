import "server-only";
import { createHash, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { rsvpSchema } from "@/lib/validation/rsvp";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendPendingNotification } from "@/lib/notifications/rsvp";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 12_000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reply = (body: object, status = 200, headers?: HeadersInit) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let expectedOrigin: string;
  try {
    // Next may normalize Request.url to localhost even when the browser used
    // 127.0.0.1. The browser's Host is authoritative for a local, unconfigured origin.
    const requestUrl = new URL(request.url);
    const fallbackOrigin = `${requestUrl.protocol}//${request.headers.get("host") || requestUrl.host}`;
    expectedOrigin = new URL(process.env.NEXT_PUBLIC_BASE_URL || fallbackOrigin).origin;
  } catch {
    return reply({ error: "RSVP is temporarily unavailable." }, 503);
  }
  if (!origin || origin !== expectedOrigin) return reply({ error: "This request could not be accepted." }, 403);
  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    return reply({ error: "Please submit the RSVP form." }, 415);
  }
  const key = request.headers.get("idempotency-key");
  if (!key || !uuid.test(key)) return reply({ error: "Please refresh the page and try again." }, 400);
  const advertisedLength = Number(request.headers.get("content-length"));
  if (advertisedLength > MAX_BODY_BYTES) return reply({ error: "Your response is too long." }, 413);

  let input: unknown;
  try {
    if (!request.body) return reply({ error: "Please check your response." }, 400);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return reply({ error: "Your response is too long." }, 413);
      }
      chunks.push(chunk.value);
    }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return reply({ error: "Please check your response." }, 400);
  }
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return reply({ error: "Please check the form and try again." }, 400);
  const { website, ...payload } = parsed.data;
  if (website) return reply({ error: "This request could not be accepted." }, 400);

  const db = getSupabaseAdmin();
  const rateSecret = process.env.RSVP_RATE_LIMIT_SECRET;
  if (!db || !rateSecret) {
    if (process.env.NODE_ENV !== "production") return reply({ mode: "preview", stored: false });
    return reply({ error: "RSVP is temporarily unavailable. Please try again later." }, 503);
  }

  // Vercel overwrites x-vercel-forwarded-for. Other hosts must supply a trusted
  // x-real-ip or proxy-sanitized x-forwarded-for; never expose this origin directly.
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
  const rateKey = createHmac("sha256", rateSecret).update(ip).digest("hex");
  const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  try {
    const { data, error } = await db.rpc("submit_wedding_rsvp", {
      p_idempotency_key: key,
      p_payload_hash: payloadHash,
      p_rate_key: rateKey,
      p_payload: payload,
    });
    if (error || !data) return reply({ error: "Your response could not be saved. Please try again." }, 503);
    if (data.status === "rate_limited") return reply({ error: "Too many attempts. Please try again in an hour." }, 429, { "Retry-After": "3600" });
    if (data.status === "conflict") return reply({ error: "This submission has already been used. Please start a new response." }, 409);
    if (data.status !== "saved" || typeof data.id !== "string") return reply({ error: "Your response could not be saved. Please try again." }, 503);
    // Awaiting keeps work alive in serverless runtimes. Failures remain queued.
    await sendPendingNotification(data.id).catch(() => false);
    return reply({ stored: true, id: data.id });
  } catch {
    return reply({ error: "Your response could not be saved. Please try again." }, 503);
  }
}
