# RSVP, database and host notifications

The browser sends JSON to `POST /api/rsvp` with an `Idempotency-Key` UUID and the normal same-origin `Origin` header. Shared Zod schemas validate the guest, conditional accommodation preferences and final submission. Accepted guests choose yes, no or unsure; declined guests use `not_applicable`. Only yes includes accommodation details. Budget is a guest preference, not a quoted hotel price or booking. Guest messages are plain text. No payment, hotel booking or guest email confirmation is performed.

## Setup

1. Create a Supabase project and apply `supabase/migrations/202611080001_wedding_rsvp.sql` with the SQL editor or your normal Supabase migration workflow.
2. Copy `.env.example` to `.env.local`. Set the public canonical origin, `SUPABASE_URL`, the server-only service-role key and a random `RSVP_RATE_LIMIT_SECRET`. Store production secrets in Vercel's environment settings. Never add the service-role key to client code, public environment variables or source control.
3. To enable host email, configure a verified Resend sender, API key and `RSVP_NOTIFICATION_TO`. These must be real host addresses supplied by the couple. Set a separate long random `RSVP_NOTIFICATION_RETRY_SECRET` for the protected retry endpoint.
4. Run the application and use the local mocked tests before testing against a dedicated staging database. Never send test RSVPs or notification emails into the couple's live systems.

In development, missing database configuration yields `{mode:"preview",stored:false}` after validation. The UI must say that this is a preview and nothing was saved. A production build with missing database configuration returns 503 and must never claim success. With a configured database, success is `{stored:true,id}`. Email delivery is deliberately not implied by this response.

## Security and persistence

All three tables have RLS enabled and no public guest policies. Anonymous and authenticated browser roles have no table grants or function execution. Only the server's service role can call the transactional functions. There is no public guest listing endpoint. Guest data is never placed in URLs or ordinary application logs. Errors returned to the guest are generic.

The route rejects cross-origin requests, non-JSON input, oversized streamed bodies, a filled honeypot and invalid UUID keys. Both Zod and SQL enforce input lengths, positive numeric values, safe integer counts and conditional accommodation consistency. No hotel price ceilings or room limits are invented. The database function serializes concurrent requests for an idempotency key, returns the existing saved record on an identical retry, and rejects changed payloads using that key. The same transaction saves an outbox notification. A database-wide atomic rate counter permits eight new submissions per hour per keyed IP hash; retries of a saved submission do not create additional records or consume the allowance.

On Vercel, `x-vercel-forwarded-for` is the trusted client address. On another host, configure the reverse proxy to overwrite `x-real-ip` and block direct access to the application origin. Do not forward arbitrary client-supplied IP headers. If neither header exists the route conservatively uses one shared unknown-address bucket. Keep the HMAC secret stable during the event. Raw IPs are not stored. This does not replace host-level denial-of-service protection: enable platform request limits for hostile traffic. Same-origin checks reduce browser abuse; they do not authenticate an invitee.

An RSVP is an invitation response, not an authenticated account. Separate browser sessions or deliberately new UUIDs can produce separate responses. Hosts should resolve legitimate corrections privately using contact details, rather than assuming that a public form verifies a person's identity.

## Reliable host email

After persistence, the route claims one queued notification and awaits the provider call. Claims use database locks and a five-minute lease, so competing requests cannot claim the same active work. Resend receives a stable `Idempotency-Key` derived from the saved RSVP ID. A timeout or provider failure leaves the guest record intact and the notification pending. A maximum of five attempts and a 23-hour automatic retry window from the first attempt stay within Resend's 24-hour idempotency retention window. Missing email configuration leaves work unclaimed. Notifications include a plain-text summary of attendance, accommodation preferences and the optional message, so recipients must be approved hosts with appropriately private inboxes.

Call `POST /api/notifications/retry` from a trusted scheduler, with `Authorization: Bearer <RSVP_NOTIFICATION_RETRY_SECRET>`. Each request claims at most one eligible notification and returns `{providerAccepted:boolean}`. Configure the scheduler cadence and batch size for the expected invitation count. Nothing is scheduled automatically and no emails are sent without environment configuration. Never expose this secret in the website or URLs. The endpoint returns no guest data. Check `rsvp_notification_outbox` privately for pending or failed attempts. Records older than the safe automatic window require a human to verify provider acceptance before deliberately requeuing; never blindly clear attempts or change the stable provider key.

An HTTP success with a nonempty provider message ID records `provider_accepted` and `provider_accepted_at`. It means that Resend accepted the message; it does not prove inbox delivery. No delivery webhook is configured. Use the private provider dashboard to investigate actual delivery or bouncing.

Provider idempotency prevents duplicates within its retention window; it is not an unlimited exactly-once guarantee. Review [Resend's idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys) before changing the retry policy. Database function privileges follow [Supabase's database functions guidance](https://supabase.com/docs/guides/database/functions). Deliverability, sender verification and inbox spam filtering must be confirmed by the host with their real domain.

## Maintenance and verification

Use Supabase's private dashboard to view responses and accommodations. Restrict dashboard access, arrange backups and set a retention period with the couple. Delete stale rate-limit rows older than two days using a private maintenance job. Deleting an RSVP cascades to its outbox row. Do not publish database exports. After the event, remove invitation data according to the agreed retention period and rotate temporary credentials.

The mocked tests exercise valid/invalid and decline branches, preview honesty, missing production configuration, origin/body/honeypot protections, stored success, throttling and database errors. They do not contact Supabase or Resend. SQL concurrency, RLS behavior and actual email delivery require a dedicated staging project; do not infer those integrations were exercised by unit tests.

## Host retention and deletion procedure

Agree the retention date with the couple before collecting guest details; no retention period is silently assumed. For a correction or deletion request, privately verify the guest's contact with the host, open the restricted Supabase dashboard, and select the matching `wedding_rsvps` record by ID. Review the selected row before using the dashboard's Delete action. Its outbox row is deleted automatically by the foreign-key cascade. Confirm the record no longer appears in the private dashboard. Also remove any authorized exports and ask hosts to delete corresponding notification messages from their inboxes. Database backups and provider logs follow their own configured retention, which the project owner must review. After the agreed retention date, perform the same review and deletion for remaining records, remove temporary exports, and rotate invitation-only credentials. This application exposes no public read, edit or deletion endpoint for guest data.

## Recommended production flow

Use the existing shared Zod schema for client feedback and mandatory server validation. Keep inline field errors, the error summary and entered values on failure. Accommodation details are required only when the guest requests accommodation. The API already checks origin, request size, honeypot and idempotency, and the database applies rate limiting.

Save the RSVP in Supabase first, then send the private host notification through Resend. Configure the host-confirmed recipient only in the server-side environment. Use a verified sender domain, keep all service keys out of browser bundles, and schedule the existing protected retry endpoint so temporary email failures cannot lose a saved RSVP. Confirm success to the guest when storage succeeds; provider acceptance is separate from inbox delivery. Test the database and email together in staging before enabling real submissions.
