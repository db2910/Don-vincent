import "server-only";
import { NextResponse } from "next/server";
import { rsvpSchema } from "@/lib/validation/rsvp";
import { getFormSubmitDestination, sendFormSubmit } from "@/lib/notifications/formsubmit";
import { checkRsvpRateLimit } from "@/lib/notifications/rate-limit";

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
  if (parsed.data.website) return reply({ error: "This request could not be accepted." }, 400);

  const destination = getFormSubmitDestination();
  if (!destination) {
    return reply({ error: "RSVP is temporarily unavailable. Please try again later." }, 503);
  }

  // Vercel overwrites x-vercel-forwarded-for. Other hosts must supply a trusted
  // x-real-ip or proxy-sanitized x-forwarded-for; never expose this origin directly.
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
  const retryAfter = checkRsvpRateLimit(ip);
  if (retryAfter) return reply({ error: "Too many attempts. Please try again shortly." }, 429, { "Retry-After": String(retryAfter) });

  try {
    const result = await sendFormSubmit(parsed.data, key, destination, `${expectedOrigin}/#rsvp`);
    if (result.accepted) return reply({ submitted: true, reference: key });
    return reply({ error: "Your response could not be sent. Your details are still here; please try again." }, result.status, result.status === 429 ? { "Retry-After": "60" } : undefined);
  } catch {
    return reply({ error: "Your response could not be sent. Please try again." }, 503);
  }
}
