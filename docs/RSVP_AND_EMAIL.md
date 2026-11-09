# FormSubmit setup and RSVP delivery

The client chose **FormSubmit**. The destination is already configured on the server as **nshimiye003@gmail.com**. No Resend API key, paid plan, Supabase database, registration or owned sender domain is required. The developer's testing address is no longer used.

## Activate it before inviting guests

1. Open the deployed invitation at **https://don-vincent1.vercel.app/** after the latest update is deployed.
2. Open/skip the envelope and complete the RSVP with an unmistakable setup response, such as name `Setup check`, your own phone/contact, attendance `Regretfully declines`, and message `Website activation check — not a real RSVP`. Submit it once.
3. Ask the client to open **nshimiye003@gmail.com**, check Inbox and Spam, and click the activation/confirmation link in the email from FormSubmit. That action must be performed by someone with access to the client's inbox.
4. Submit a second clearly labeled setup response from the **same live website**. Confirm that the client receives an email with the wedding subject, attendance and submitted details. Check Spam if needed. The client can delete setup emails afterward.
5. Share the invitation with guests after activation and delivery are confirmed. First-time submissions may wait for activation; a website confirmation alone does not establish that Gmail received the email.

No configuration changes are needed for the supplied client inbox. If changing recipients later, set the server-only `FORMSUBMIT_RECIPIENT` in Vercel and redeploy; the new inbox must be activated. `NEXT_PUBLIC_BASE_URL` is optional, but if already set it must match the exact browser origin. Remove or correct an obsolete origin pointing at a different Vercel project. Activating localhost is not a substitute for checking the live site.

Old `RESEND_*`, `RSVP_NOTIFICATION_*`, `RSVP_EMAIL_MODE`, `RSVP_TEST_EMAIL` and `SUPABASE_*` variables are no longer read and can be removed from hosting settings. No private keys are required by this integration.

## What was changed

The form stays on the invitation and posts to `POST /api/rsvp`. Shared Zod validation runs in the browser and again on the server. The server forwards only the validated, applicable fields to FormSubmit's AJAX endpoint. The destination is kept out of the browser bundle and cannot be selected by a submitted request.

The email uses FormSubmit's **table** template and subject `Wedding RSVP · Shee Salamata & Don Vincent`. Field labels describe attendance, contact, requested accommodation, room budget, nights, breakfast and room sharing in readable language. The optional guest message is included. Phone-only contacts are supported; a valid email contact is also supplied as FormSubmit's Reply-To email field. No extra CC recipient or automatic guest email is enabled.

FormSubmit's documented email templates are basic, table and box; the previous custom Resend HTML design is not used. The website retains its ivory/gold form, inline confirmation and response review. The provider controls the notification email's layout and sender identity.

The old RSVP preview banner and preview/test states are removed. Every valid submission now attempts FormSubmit. Missing/invalid provider acceptance shows a retry message while preserving inputs. `Your RSVP details` is an accessible fieldset label, with no extra visible legend. WhatsApp is completely hidden until a valid `NEXT_PUBLIC_HOST_WHATSAPP` number is provided, so guests do not see an unavailable secondary action.

## Data and success

An accepted request returns `{submitted:true,reference}` only when FormSubmit explicitly returns `success:true` or `success:"true"`. The UI says the reply was **submitted**; it does not claim final inbox delivery or a database record. FormSubmit sends to the client's mailbox and documents a 30-day submissions archive. This app has no separate guest database, guest-count dashboard or recovery queue. The Supabase source dependency, migration and old retry endpoint were removed; no external records were accessed or deleted.

The browser keeps the same UUID for retrying unchanged details and creates another when details change. Within a warm server instance, identical concurrent requests share one provider call, and accepted references are cached for up to 24 hours. The cache stores reference/hash/result, not guest details, and is bounded. FormSubmit does not document provider-wide idempotency: process restarts, different instances or a lost provider response can still produce duplicates. Emails include the stable Reference so hosts can recognize them.

## Validation and abuse protection

The route rejects cross-origin requests, missing/invalid UUIDs, non-JSON input, bodies above 12 KB, honeypots and inconsistent accommodation fields. Accommodation requests are planning preferences, not bookings. Guest input cannot override the recipient, template, subject or add a CC. Provider errors and guest details are not written to application logs.

AJAX submissions disable the provider's interactive CAPTCHA to keep guests on the invitation. The server retains its honeypot and a bounded eight-attempts-per-ten-minutes guard per hashed trusted IP, per instance. This guard is not shared across serverless instances; hosting firewall rules can provide deployment-wide protection. Vercel supplies the trusted IP header; another host must sanitize `x-real-ip` at its proxy.

## Verification limits

Automated API tests mock FormSubmit; browser submissions are intercepted. They cover validation, conditional fields, recipient selection, provider errors, retry coalescing, unchanged references, removed notices and preserved form inputs. They do not send activation messages or real responses to the client. The account owner must complete the activation and inbox check above.

The hero, refresh overlay, no-JavaScript fallback, keyboard behavior, mobile layouts and music are verified independently of live email activation. Hosts manage mailbox retention and any exports; FormSubmit's own records follow its service settings.

Official references: [setup and activation](https://formsubmit.co/), [AJAX](https://formsubmit.co/ajax-documentation), [templates and archive](https://formsubmit.co/documentation), [activation help](https://formsubmit.co/help).
