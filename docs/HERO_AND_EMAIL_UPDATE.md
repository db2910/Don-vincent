# Hero, envelope and FormSubmit update

This report supersedes the earlier Supabase/Resend implementation notes. The current delivery provider is FormSubmit, configured for the client inbox. [Activation steps and data flow](RSVP_AND_EMAIL.md).

## Visible changes

- Desktop `couple.jpeg` framing is bounded independently of the text and removes the previous extra zoom. Both faces sit above the invitation wording. Navigation remains readable and available.
- The envelope is present in the initial server HTML and covers the viewport before JavaScript loads, including refreshes at RSVP. It upgrades to a native modal after hydration. Controls wait until interactive, keyboard focus moves to the seal, and opening/skipping returns to the hero. Without JavaScript, the invitation remains accessible.
- The continuous RSVP now sends through FormSubmit. The old preview banner and development preview path are removed. Unconfigured WhatsApp controls are hidden, and the outer fieldset's name is accessible without a visible legend.
- FormSubmit uses its table email layout, wedding subject and readable response fields. The website confirmation retains the invitation styling. The client's inbox must activate the live form; no activation email was triggered by automated checks.

## Readability

Rendered hero/navigation samples passed at 320, 390, 768 and 1440 pixels wide. Minimum sampled contrast ratios were 6.14, 7.52, 7.25 and 8.90 respectively. [Measurements](screenshots/civil-wedding/readability.json), [desktop hero](screenshots/civil-wedding/hero-1440.png).

## Validation

- 68 unit/API tests pass, including conditional fields, provider acceptance/failures, retry coalescing, reference conflicts, input retention, origin/body/honeypot checks and per-instance throttling. FormSubmit is mocked.
- Lint, TypeScript checking and the production build pass.
- 20 targeted browser checks passed across the envelope and final FormSubmit runs. Verification covers the envelope with scripts deliberately withheld, focus, replay, Escape, reduced motion, no-JavaScript access, the hero, actual MP3 play/pause, form branches/retries and responsive layouts. Browser submissions use fixtures and do not email the client.

Live activation and actual Gmail receipt require the client inbox owner. No separate database, guest dashboard or notification queue is provisioned. FormSubmit controls email rendering and documents its own 30-day archive. Retry/rate guards are bounded and per server instance; they are not distributed guarantees.
