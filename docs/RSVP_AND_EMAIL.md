# FormSubmit testing and RSVP delivery

The owner requested a temporary switch to **donkyleben@gmail.com** for testing. The final client inbox is **nshimiye003@gmail.com**. Do not restore it until the owner confirms that testing works. The client and owner have each confirmed clicking their activation link. No Resend account, API key, database, paid plan or owned sender domain is required.

## Current test setup and restoration

`getFormSubmitDestination()` temporarily defaults to the owner's inbox. The private `.env.local` and `.env.example` use `FORMSUBMIT_RECIPIENT=donkyleben@gmail.com`. An existing Vercel override takes precedence over the source default; check the preparation endpoint's returned destination before sending a real test. All tests must be clearly labeled as setup checks, not guest RSVPs.

1. Open **https://don-vincent1.vercel.app/** after the latest deployment.
2. Submit a clearly labeled setup response and confirm its FormSubmit success and receipt at **donkyleben@gmail.com**. If activation is requested, check Inbox/Spam and click **Activate Form** before retrying.
3. If the service explicitly rejects the AJAX request, use **Continue with verification**, complete the security check in its new tab, and wait for the provider's confirmation.
4. After the owner confirms delivery works, restore the source default and both local/Vercel `FORMSUBMIT_RECIPIENT` values to **nshimiye003@gmail.com**, then redeploy.
5. Confirm actual client inbox receipt from the final live URL before inviting guests. Changing the recipient or website may require activation again. Delete setup emails afterward if desired.

Do not share the testing deployment as the final guest invitation while responses go to the owner's testing inbox. `NEXT_PUBLIC_BASE_URL`, if configured, must equal the browser's actual origin.

## Why delivery changed

The deployed server-to-FormSubmit request returned HTTP **403**, confirmed by support code `FORM-403-provider_rejected`. A separately authorized request from the developer's computer to the owner's test inbox returned HTTP 200 with an activation-required response. The owner then confirmed activation. This establishes that the live server's request was refused; it does not identify the provider's precise security rule. Changing email alone is not a proven fix for that refusal.

Delivery now follows FormSubmit's documented **browser AJAX** flow. `POST /api/rsvp` validates and prepares the response but makes **no outbound provider request**. The guest's browser then posts the prepared fields directly to `https://formsubmit.co/ajax/<recipient>`. This avoids the server-to-server request that was rejected. Browser CORS/network restrictions, provider filtering and inbox delivery still need checking on the deployed site.

## Data flow and validation

The browser validates the continuous form and sends JSON to the same-origin preparation endpoint with a stable UUID. The server checks the origin, content type, UUID, 12 KB body limit, honeypot, shared Zod schema and per-instance rate limit. It chooses the configured recipient and prepares only applicable fields. Guest input cannot choose the recipient or add a CC or autoresponse.

The response contains a reference, AJAX delivery instructions and a matching standard browser form for optional verification. This HTTP 200 means **prepared**, never **sent**. The browser validates the provider URL, recipient endpoint, field constraints and matching reference before sending. The destination becomes visible in the prepared browser request, as with standard FormSubmit forms; it is not an API secret. No provider cookies or manually fabricated browser Referer are sent.

The email uses FormSubmit's **table** template and `Wedding RSVP · Shee Salamata & Don Vincent` subject. It includes name, phone/email, attendance, applicable accommodation preferences, optional message and reference. A valid contact email enables Reply-To; a phone is never passed as an email. The provider controls email layout and sender identity. The website's inline confirmation retains its ivory/gold styling.

Only explicit provider `success:true` or `success:"true"` shows **Your reply has been submitted**. HTTP 200 alone, successful preparation, activation-required responses and malformed provider replies do not confirm submission. Safe errors retain all inputs; raw provider messages and guest details are not logged or shown. A support code such as `FORM-403-provider_rejected` exposes only status and a fixed error category.

## Verification and WhatsApp

After explicit provider rejection, **Continue with verification** offers a native browser POST using the same validated details, recipient and reference. It omits `_captcha` so FormSubmit can run its security check. It opens a new tab with `noopener` and preserves the origin referrer; `_url` supplies the full invitation URL. It retains FormSubmit's real confirmation page and never marks the invitation as sent merely because the tab opened. Editing any form field removes the prepared fallback. Timeouts and unreadable responses have uncertain delivery and do not offer an automatic second sending path. FormSubmit documents technical limitations when CAPTCHA is disabled; the fallback enables it.

WhatsApp uses **+250788408241**. It prepares the valid response as a message; the guest still presses Send in WhatsApp. It is not an email receipt or a database record.

## Retention and retries

There is no guest database or delivery queue in this app. FormSubmit documents its own 30-day archive. Provider acceptance does not establish Gmail delivery. The busy guard prevents concurrent sends in the mounted form; unchanged retries retain their UUID, and emails include that Reference. There is no provider-wide exactly-once guarantee or server delivery cache. Refreshing, losing a response or submitting the verification form more than once may duplicate a reply.

The preparation endpoint retains its bounded eight-attempts-per-ten-minutes guard per hashed trusted IP, per instance. This does not govern the provider's public endpoint or provide a distributed limit. Browser AJAX disables provider CAPTCHA for inline sending; the native fallback enables it. On Vercel use the trusted forwarding header; other hosts must sanitize proxy headers. No extra guest emails or CCs are configured.

## Verification record

Automated tests mock browser FormSubmit delivery and intercept native fallback POSTs. They send no emails. They cover validation, recipient selection, no server provider calls, preparation versus acceptance, malicious/mismatched endpoints, conditional fields, activation/errors, stable retry references and preserved input.

Earlier authorized client-inbox setup checks triggered activation and reproduced the rejection. On 11 November 2026 the owner explicitly requested using their own inbox for testing. One labeled request to **donkyleben@gmail.com** returned HTTP 200 with an activation-required message (reference `3eb4eb18-985a-46e0-818a-56a642f7f7fb`); the owner then confirmed activation. Final browser-flow acceptance and actual inbox receipt are recorded after the live delivery check.

Official references: [setup/CAPTCHA](https://formsubmit.co/), [browser AJAX](https://formsubmit.co/ajax-documentation), [activation help](https://formsubmit.co/help), [templates and archive](https://formsubmit.co/documentation).
