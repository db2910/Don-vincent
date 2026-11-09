# Civil wedding update — 10 November 2026

This is the current specification and supersedes the earlier Gusaba, provisional-time, session-memory and missing-audio notes in historical redesign reports.

- The invitation, hero, metadata, social image, calendar and WhatsApp wording now identify a Civil Wedding.
- The reference-inspired itinerary contains exactly two events: Civil Marriage at City Hall at 3:00 PM; Wedding Reception at Kigali Serena Hotel at 4:00 PM. Times are in Africa/Kigali on 17 December 2026. No end times or City Hall address were invented.
- The countdown targets 3:00 PM in Kigali. The downloadable calendar contains separate events at 13:00 UTC and 14:00 UTC with their respective locations.
- Both hero layouts use the supplied `couple.jpeg`. Mobile framing retains both faces and fades into the background. The header and lower gradient preserve text contrast.
- The supplied `public/audio/perfect.mp3` plays through the existing native audio component. The floating control follows actual play/pause events and includes an accessible track description. It sits beside the mobile menu so the countdown remains clear. Opening the envelope requests playback; Skip and refresh do not start music without a gesture.
- Every page load presents the envelope. Completing, skipping or replaying it returns to the hero.

## Validation

57 unit/integration tests and 21 browser tests passed, including actual MP3 playback, pause/resume, refresh from RSVP, conditional form branches, keyboard/dialog behavior, gallery, calendar and six responsive viewport layouts. Lint, TypeScript checks and the production build passed.

Hero/navigation readability was sampled against the rendered photograph at 320, 390, 768 and 1440 pixels. The minimum sampled ratios were 6.14:1, 7.52:1, 8.04:1 and 7.58:1. The itinerary text colors measure at least 4.65:1 against the ivory background. This is a focused contrast and layout check, not an accessibility certification. Screenshots and sampled results are in `docs/screenshots/civil-wedding/`.

## RSVP recommendation

Keep the existing shared Zod client/server validation, private Supabase persistence and Resend notification outbox. Store the host-confirmed recipient in the server-only `RSVP_NOTIFICATION_TO` setting. Configure database credentials, a rate-limit secret, Resend API key, verified sender and notification retry secret in Vercel. Schedule the existing protected retry endpoint. Saved RSVPs must survive temporary email failures, and retries must not duplicate records or notifications. Email credentials and live delivery are not provisioned by this visual update; no real test submissions or emails were sent.
