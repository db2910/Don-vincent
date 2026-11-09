import "server-only";
import { createHmac, randomBytes } from "node:crypto";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const MAX_BUCKETS = 2000;
const salt = randomBytes(32);
const attempts = new Map<string, { count: number; expires: number }>();

/** Bounded per-instance protection, supplemented by the hosting firewall.
 * This is not a distributed/database rate limit. Raw IPs are never retained. */
export function checkRsvpRateLimit(ip: string): number {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const key = createHmac("sha256", salt).update(ip).digest("hex");
  const current = attempts.get(key);
  if (current) {
    if (current.count >= MAX_ATTEMPTS) return Math.ceil((current.expires - now) / 1000);
    current.count++;
  } else {
    if (attempts.size >= MAX_BUCKETS) return 60;
    attempts.set(key, { count: 1, expires: now + WINDOW_MS });
  }
  return 0;
}
