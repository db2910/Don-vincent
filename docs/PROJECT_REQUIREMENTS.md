# Current project requirements

Primary source: original master brief, amended by the major design/animation/UX brief supplied on 8 November 2026. The following reflects the latest requested behavior.

## Confirmed facts

Shee Salamata & Don Vincent; monogram S & D; Gusaba Wedding; Thursday, 17 December 2026; Kigali Serena Hotel; Africa/Kigali. Ceremony start/end, RSVP deadline, contacts, music, biography and accommodation rates remain unconfirmed. Preserve client wording and invent no cultural or personal facts.

## Required improvements to the existing app

- Retain Next.js App Router, strict TypeScript, Tailwind, existing server integration, calendar, venue, gallery and accessibility; do not start another project or deploy automatically.
- Inventory and visually inspect every supplied photograph and all audio assets; preserve originals. Use the new suitable photographs across a full-background hero, couple/story collage and gallery, with responsive sources and natural aspect ratios.
- Full photographic hero on desktop and mobile; pearl script names, readable warm overlay, date, RSVP, scroll cue and immediately integrated Days/Hours/Minutes/Seconds countdown.
- The provisional countdown target is the beginning of 17 December in Kigali, explicitly a date target rather than an invented ceremony time. Confirmed `startTime` replaces it. No hydration mismatch, negative values or leaked intervals. Calendar stays all-day until both times are confirmed.
- Subtle, continuous, limited CSS falling hearts in edge lanes. No pointer interception, excessive DOM/CPU use or reduced-motion animation.
- Unlettered closed envelope, centered wax seal, slightly larger envelope hearts, refined paper/folds/borders. Every opening returns to the hero; couple names remain on the revealed card. One tracked animation timeline with idle/opening/revealing-card/card-visible/transitioning/completed states and genuine card emergence. Repeat/skip/interruption/replay/session/focus/keyboard/touch behavior must recover reliably.
- If approved audio exists, use it. Otherwise leave a configurable single-instance player ready. Opening the envelope must request playback synchronously in the user gesture. No page-load playback, false playing state, fabricated song or unrelated music.
- Audit all typography: readable paragraphs, labels, dates, supporting copy and navigation; strong contrast; prominent names throughout.
- Replace the three-step RSVP with one continuous conditional form: accepted reveals accommodation; Yes reveals details; No/unsure require none; declined hides stay fields. One optional message and one final submit action. Preserve values, validation, retry/idempotency, private storage and honest preview. Success only after persistence and shown inline.
- Keep Supabase, RLS, rate limiting, anti-spam, outbox notifications and configured-only WhatsApp intact. Unknown secrets/contacts fail or omit safely.
- Verify 320, 390, 768, 1024 and 1440px, plus short landscape; no horizontal overflow, distorted photos, obstructed form controls or console exceptions. Run strict checks, relevant tests, production build and actual browser interaction/screenshot review.

## Source of truth

All wedding details, photo roles, gallery and the optional music source live in `src/lib/wedding-config.ts`. Server secrets stay in environment variables. Reports must distinguish mocked checks from live service/audio verification.
