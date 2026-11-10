# FormSubmit setup and RSVP delivery

The client chose **FormSubmit**. The destination is already configured on the server as **nshimiye003@gmail.com**. No Resend API key, paid plan, Supabase database, registration or owned sender domain is required. The developer's testing address is no longer used.

## Activate it before inviting guests

1. Open the deployed invitation at **https://don-vincent1.vercel.app/** after the latest update is deployed.
2. Open/skip the envelope and complete the RSVP with an unmistakable setup response, such as name `Setup check`, your own phone/contact, attendance `Regretfully declines`, and message `Website activation check — not a real RSVP`. Submit it once.
3. Ask the client to open **nshimiye003@gmail.com**, check Inbox and Spam, and click the activation/confirmation link in the email from FormSubmit. That action must be performed by someone with access to the client's inbox.
4. Submit a second clearly labeled setup response from the **same live website**. If the inline send is rejected, choose **Continue with verification**, complete FormSubmit's security check in the new tab, and wait for its confirmation. Confirm that the client receives an email with the wedding subject, attendance and submitted details. Check Spam if needed. The client can delete setup emails afterward.
5. Share the invitation with guests after activation and delivery are confirmed. First-time submissions may wait for activation; a website confirmation alone does not establish that Gmail received the email.

No configuration changes are needed for the supplied client inbox. If changing recipients later, set the server-only `FORMSUBMIT_RECIPIENT` in Vercel and redeploy; the new inbox must be activated. `NEXT_PUBLIC_BASE_URL` is optional, but if already set it must match the exact browser origin. Remove or correct an obsolete origin pointing at a different Vercel project. Activating localhost is not a substitute for checking the live site.

Old `RESEND_*`, `RSVP_NOTIFICATION_*`, `RSVP_EMAIL_MODE`, `RSVP_TEST_EMAIL` and `SUPABASE_*` variables are no longer read and can be removed from hosting settings. No private keys are required by this integration.

## What was changed

The form stays on the invitation and posts to `POST /api/rsvp`. Shared Zod validation runs in the browser and again on the server. The server forwards only the validated, applicable fields to FormSubmit's AJAX endpoint. The destination is configured on the server and cannot be selected by a submitted request.

After an explicit provider rejection, the response also contains a standard FormSubmit browser form for **Continue with verification**. This form uses the same validated details, recipient and Reference. It enables FormSubmit's own CAPTCHA by omitting `_captcha`, opens in a new tab, and uses the provider's real confirmation page. Preparing or opening it never marks the invitation as submitted. Editing any guest detail removes the prepared form so stale details cannot be sent. The browser receives the recipient endpoint when this fallback is offered; that address is not an API secret. This fallback is not offered for timeouts or unreadable responses, when delivery may be uncertain, or for rate limits and activation errors. It sends nothing until the guest chooses it.

The email uses FormSubmit's **table** template and subject `Wedding RSVP · Shee Salamata & Don Vincent`. Field labels describe attendance, contact, requested accommodation, room budget, nights, breakfast and room sharing in readable language. The optional guest message is included. Phone-only contacts are supported; a valid email contact is also supplied as FormSubmit's Reply-To email field. No extra CC recipient or automatic guest email is enabled.

FormSubmit's documented email templates are basic, table and box; the previous custom Resend HTML design is not used. The website retains its ivory/gold form, inline confirmation and response review. The provider controls the notification email's layout and sender identity.

The old RSVP preview banner and preview/test states are removed. Every valid submission now attempts FormSubmit. Activation-required responses explain that host confirmation is pending and offer WhatsApp. Timeouts, unavailable connections and other provider failures have separate safe messages; every failure preserves the form inputs. A bounded support code such as `FORM-403-provider_rejected` exposes only the provider HTTP status and fixed failure category, allowing diagnosis without Vercel logs. Raw provider messages, recipient addresses and guest input are never included in this code. `Your RSVP details` is an accessible fieldset label, with no extra visible legend. WhatsApp RSVP uses the host-confirmed **+250788408241**. It prepares a message after valid form details are entered; guests must press Send in WhatsApp. `NEXT_PUBLIC_HOST_WHATSAPP` optionally overrides this number.

## Data and success

An accepted request returns `{submitted:true,reference}` only when FormSubmit explicitly returns `success:true` or `success:"true"`. The UI says the reply was **submitted**; it does not claim final inbox delivery or a database record. FormSubmit sends to the client's mailbox and documents a 30-day submissions archive. This app has no separate guest database, guest-count dashboard or recovery queue. The Supabase source dependency, migration and old retry endpoint were removed; no external records were accessed or deleted.

The browser keeps the same UUID for retrying unchanged details and creates another when details change. Within a warm server instance, identical concurrent requests share one provider call, and accepted references are cached for up to 24 hours. The cache stores reference/hash/result, not guest details, and is bounded. FormSubmit does not document provider-wide idempotency: process restarts, different instances or a lost provider response can still produce duplicates. Emails include the stable Reference so hosts can recognize them.

## Validation and abuse protection

The route rejects cross-origin requests, missing/invalid UUIDs, non-JSON input, bodies above 12 KB, honeypots and inconsistent accommodation fields. Accommodation requests are planning preferences, not bookings. Guest input cannot override the recipient, template, subject or add a CC. Application logs record only a fixed provider-failure category and HTTP status. Guest details, email addresses, raw provider messages and transport error details are never logged.

AJAX submissions disable the provider's interactive CAPTCHA to keep guests on the invitation. FormSubmit documents possible technical limitations when CAPTCHA is disabled; this is a possible explanation for rejection, not a confirmed diagnosis of the reported failure. The verification fallback submits directly from the browser with FormSubmit's CAPTCHA enabled. The server retains its honeypot and a bounded eight-attempts-per-ten-minutes guard per hashed trusted IP, per instance. This guard is not shared across serverless instances; hosting firewall rules can provide deployment-wide protection. Vercel supplies the trusted IP header; another host must sanitize `x-real-ip` at its proxy.

## Verification limits

Automated API tests mock FormSubmit; browser submissions are intercepted, including the external browser POST. They cover validation, conditional fields, recipient selection, provider errors, retry coalescing, unchanged references, removed notices, preserved form inputs, CAPTCHA-enabled browser handoff, safe support codes and rejection of untrusted fallback destinations. They do not send activation messages or real responses to the client.

An earlier separately authorized setup check reached FormSubmit and returned HTTP 200 with success:false and "This form needs Activation". The host subsequently confirmed that the client received the activation email and clicked its link. One further authorized setup check through the deployed invitation reproduced HTTP 503 with `provider_rejected` (reference `19b32a30-b617-45aa-bb1d-033a746671b8`). That 503 is the app's status, not the unknown upstream status. Runtime logs were unavailable to the agent and host. No further live submissions were sent while implementing the fallback. The exact provider rejection reason and final inbox delivery through verification remain unconfirmed; the client must complete that check before sharing with guests.

The hero, refresh overlay, no-JavaScript fallback, keyboard behavior, mobile layouts and music are verified independently of live email activation. Hosts manage mailbox retention and any exports; FormSubmit's own records follow its service settings.

Official references: [setup and activation](https://formsubmit.co/), [AJAX](https://formsubmit.co/ajax-documentation), [templates and archive](https://formsubmit.co/documentation), [activation help](https://formsubmit.co/help).
