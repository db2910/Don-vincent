# Royal Elegance redesign report

The existing Next.js application was improved in place on 8 November 2026. No replacement project or deployment was created, and the backend data contract was preserved.

## Design and typography

The split hero has been replaced by a full-width, full-background photograph on every screen size. A warm graduated overlay, fine gold frame, large pearl calligraphy, date, integrated countdown, RSVP action and scroll cue create the cinematic composition. Different portrait/landscape sources preserve the couple on phones and larger screens. Copy sits below their faces. Main section titles now use a consistent royal serif; paragraph text, navigation, dates, field labels, hints and buttons have been enlarged and given stronger contrast.

The formal double-framed invitation remains, with more readable wording and date. The couple section is now a two-photo editorial composition rather than another reuse of the original image. The gallery contains four distinct photographs, keeps their natural orientations, and uses deliberate spacing and staggered desktop rows. Closing names are large calligraphy. Small screens stack the gallery, use a usable menu, retain full photographic backgrounds, and comfortably fit the countdown and expanded accommodation questions.

## Photographs actually used

Every added photograph was visually inspected and measured. The inventory includes all original filenames, JPEG dimensions, aspect ratios, visible content and placement recommendations. All nine originals remain unchanged in `client-assets/pending-review/`. Five suitable files were copied byte-for-byte with their original filenames to `public/images/moments/`:

| Original filename | Current placement |
| --- | --- |
| `WhatsApp Image 2026-11-06 at 12.04.15.jpeg` | Full-background desktop/tablet hero |
| `WhatsApp Image 2026-11-06 at 12.04.16 (1).jpeg` | Portrait full-background phone hero |
| `WhatsApp Image 2026-11-06 at 12.04.16.jpeg` | Gallery, “A shared smile” |
| `WhatsApp Image 2026-11-06 at 12.04.18.jpeg` | Supporting story inset and gallery, “Close to you” |
| `WhatsApp Image 2026-11-06 at 12.04.21.jpeg` | Couple introduction and gallery, “Moments together” |

The original `public/images/couple.jpeg` remains the fourth gallery entry, “With you, always”. No gallery source is duplicated. Other supplied portraits/group/personal compositions were preserved rather than placed into the public couple-focused design. No biography or occasion was inferred from the photographs. See [ASSET_INVENTORY.md](ASSET_INVENTORY.md).

The hero uses a responsive `<picture>` with Next.js-optimized source sets and eager/high-priority loading, avoiding an unnecessary desktop-image preload on phones. Content images use measured dimensions, natural heights and lazy loading. Lightbox images fit within the screen without distortion.

## Envelope and motion

The closed envelope has an unlettered front with a centered S&D wax seal, fine gold paper edges, dimensional folds and botanical corners. The revealed card uses 30–52px names and readable supporting details.

One tracked Motion timeline controls `idle → opening → revealing-card → card-visible → transitioning → completed`. The seal releases; the flap rotates backwards; the opaque paper rises from inside the front folds; the flap is placed behind it; the card holds for reading; and the hero is revealed. The scene reserves the emergence space before playback, replacing moving-bound measurements and independently managed animations. The complete sequence is approximately 4.05 seconds.

Repeated activation is guarded synchronously. Skip, Escape, reduced motion, failure and unmount terminate safely; stale callbacks cannot affect a replay. The native dialog contains focus, locks/restores scrolling, records session entry and keeps essential wedding details available without JavaScript. Every completion instantly returns to the hero, sets #home and focuses the hero heading, including replays. Hero type entrances restart when the envelope reveals the page.

Twelve small CSS hearts drift through fixed edge lanes on the page and in a separate native-dialog layer; eight remain visible on phones. Envelope hearts are 1.6 times the page heart size. Sizes, opacity, duration, warm rose/champagne colors and drift vary deterministically. No per-frame React updates or particle library is used. Pointer events are disabled, central faces/form content remain clear, and reduced motion disables hearts entirely.

## Music status and behavior

**No audio file was found, so no song is used and audible playback is not claimed.** The full audio system is ready. Add the approved, licensed song to `public/audio/`, then configure `music.src` and `music.title` in `src/lib/wedding-config.ts`.

The envelope's opening click/tap/key handler dispatches the music request synchronously before its first await. One persistent audio element owns playback; page load, session restoration and Skip never start it. The player waits for playback and media events, shows loading, uses play/pause controls and actual state, handles rejected playback with a manual retry, and cleans up resources without restarting while scrolling. A generation guard prevents stale play promises from changing a later state. The small gold-accented control stays hidden until a song is configured and hides during field focus to keep typing clear.

Unit tests mock the media API to verify playback, pause, rejection, loading, synchronous request and retry. A real browser check confirms the envelope request occurs while `navigator.userActivation.isActive` is true. Actual audio decoding, audible playback and a real song's behavior on iOS/Android remain unverified because the approved file is missing.

## Continuous conditional RSVP

The wizard, progress steps and Continue/Back actions are removed. Full name, contact, attendance and optional message remain in one form, with one Send My RSVP action. Accepting immediately reveals accommodation; Yes reveals preferences directly beneath it. No/unsure require no preferences; declining hides accommodation. CSS reveals are restrained and respect reduced motion.

Toggling answers preserves local values while the submitted payload removes inapplicable details. Shared Zod validation, positive numeric/integer checks, accessible linked errors, request timeout, in-flight protection, stable retry UUID and changed-payload handling remain. Results stay inline: real success only follows confirmed backend storage; preview explicitly says nothing was stored or emailed. A saved form stays visible and disabled. Failed requests retain entries and offer Try Again. Configured WhatsApp still prepares an encoded reply; without a host number it remains clearly unavailable.

## Backend and retained features

Supabase schema, private RLS/grants, transactional idempotency, distributed rate limits, honeypot/body/origin validation and server-only keys are unchanged. The Resend outbox still persists before notifying, records provider acceptance rather than claiming delivery, and supports protected bounded retries. No live credentials were supplied, so migration execution, RLS/concurrency and real email delivery still require staging verification. No test guests or emails were sent to client systems.

Venue directions and the optional lazy map are retained. Save the Date still generates an all-day 17 December event ending exclusively on 18 December. The hero countdown now provisionally targets **17 December 2026, 00:00 Africa/Kigali = 16 December 2026, 22:00 UTC**, as the new brief requests. It explicitly labels the ceremony time unconfirmed; it does not change `startTime` or the calendar into an invented timed ceremony. A configured start replaces the provisional countdown. Initialization is hydration-safe, ticks each second, clamps to zero, stops its interval and handles the past-date state.

## Verification

| Check | Result |
| --- | --- |
| Strict TypeScript | Passed |
| ESLint | Passed, no errors or warnings |
| Unit/integration tests | **56/56 passed across 7 files** |
| Browser functionality and responsive checks | **18 distinct browser cases verified across the main run and focused reruns**; see execution note below |
| Responsive sizes | 320×568, 390×844, 768×1024, 1024×768, 1440×1000 and 844×390 |
| Horizontal overflow | None at all six sizes, including expanded accommodation |
| Repeated envelope / card bounds | Repeated keyboard/replay cycles; full required phases; opaque emerged paper stays inside all six viewports |
| RSVP branches | Accept + yes/no/unsure and decline; inline preview, hidden detail clearing, preserved values, real-success acknowledgment and stable-key retry fixtures |
| Gallery and calendar | Keyboard arrows, touch swipe, focus wrap/restoration, Escape, responsive images and downloaded date-only ICS verified |
| Music | Synchronous active-user-gesture dispatch verified in browser; play/pause/rejection/manual retry covered by mocked media tests; no real song available |
| Production build | Passed |
| Production browser review | Phone and desktop screenshot review; all configured photos loaded; **no console errors or page exceptions** |
| Deployment | Not performed |

Execution note: the main run passed 16 cases; two test-harness issues were corrected without changing application behavior. An error selector was scoped to RSVP instead of also matching Next.js's route announcer, and the viewport screenshot loop now uses Escape rather than waiting for a Skip button after an already completed animation. The hero and viewport-reveal regression then passed in focused checks. A trace-artifact cleanup collision during overlapping runner teardown required an isolated final retry check. These were verification harness issues, not hidden application failures. The isolated final retry check passed 1/1: the fixture returned a temporary failure followed by confirmed storage, all fields remained available until success, and both attempts used the same idempotency key. Together with the main run and the successful hero/viewport rerun, all 18 distinct browser cases have passed.

The only build warning is the expected missing metadata origin: no real domain is configured. Set `NEXT_PUBLIC_BASE_URL` before production. Supabase, email, WhatsApp contacts, ceremony time, deadline, accommodation rates and biography were not invented.

## Review screenshots

- [Production desktop hero](screenshots/redesign/production-hero-1440.png)
- [Production phone hero](screenshots/redesign/production-hero-390.png)
- [Full desktop invitation](screenshots/redesign/production-invitation-1440.png)
- [Full phone invitation](screenshots/redesign/production-invitation-390.png)
- [Closed envelope, desktop](screenshots/redesign/envelope-closed-desktop.png)
- [Closed envelope, phone](screenshots/redesign/envelope-closed-mobile.png)
- [Revealed invitation, phone](screenshots/redesign/envelope-revealed-mobile.png)
- [Revealed invitation, desktop](screenshots/redesign/envelope-revealed-desktop.png)
- [Revealed invitation, short landscape](screenshots/redesign/envelope-revealed-landscape.png)

## Exact changed files

Application and styles:

```text
src/app/globals.css
src/app/page.tsx
src/lib/wedding-config.ts
src/lib/calendar/countdown.ts
src/lib/music.ts
src/components/envelope/EnvelopeExperience.tsx
src/components/envelope/EnvelopeExperience.module.css
src/components/envelope/InvitationCard.tsx
src/components/envelope/WaxSeal.tsx
src/components/invitation/WeddingHero.tsx
src/components/invitation/WeddingHero.module.css
src/components/invitation/WeddingCountdown.tsx
src/components/invitation/WeddingCountdown.module.css
src/components/invitation/CoupleStory.tsx
src/components/invitation/FormalInvitation.tsx
src/components/invitation/CelebrationDetails.tsx
src/components/invitation/PhotoGallery.tsx
src/components/invitation/PhotoGallery.module.css
src/components/invitation/SaveTheDate.tsx
src/components/invitation/SaveTheDate.module.css
src/components/invitation/ClosingMessage.tsx
src/components/shared/FallingHearts.tsx
src/components/shared/FallingHearts.module.css
src/components/shared/MusicToggle.tsx
src/components/shared/MusicToggle.module.css
src/components/shared/SectionReveals.tsx
src/components/rsvp/RSVPForm.tsx
src/components/rsvp/rsvp.css
```

Tests:

```text
src/components/rsvp/RSVPForm.test.tsx
tests/calendar.test.ts
tests/countdown-gallery.test.tsx
tests/envelope.test.tsx
tests/e2e/invitation.spec.ts
```

Documentation: `README.md`, `docs/PROJECT_REQUIREMENTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/ANIMATION_SPECIFICATION.md`, `docs/CLIENT_DETAILS_PENDING.md`, `docs/IMPLEMENTATION_REPORT.md`, new `docs/ASSET_INVENTORY.md`, this `docs/REDESIGN_REPORT.md`, and `docs/REDESIGN_FILES.txt`. Five new public photograph copies are listed by their exact names above. New screenshots are under `docs/screenshots/redesign/`; the complete source/document/media/artifact path list is in [REDESIGN_FILES.txt](REDESIGN_FILES.txt). No dependency, backend route, database migration, credential or original-upload file was changed.

## Run and remaining configuration

Dependencies are already installed:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`. The existing user development server was reused and left running; the temporary production QA server on port 3002 was stopped.

Before live collection: provide the approved song; configure verified host email/WhatsApp and production origin; apply and test the Supabase migration in staging; validate real email acceptance/delivery and audio on guest devices; agree privacy retention; and confirm ceremony times/deadline when available. Deployment remains a separate explicit request.
