# Shee Salamata & Don Vincent

An Enhanced Classic Royal Wedding invitation, built with Next.js App Router, strict TypeScript, Tailwind CSS, Motion, Zod and FormSubmit. Thursday, **17 December 2026**: wedding ceremony at **Kigali City Hall, 3:00 PM**, followed by the reception at **Kigali Serena Hotel, 4:30 PM**, Africa/Kigali.

## Run locally

Use Node.js 22 or later and npm. From this folder:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open **http://127.0.0.1:3000**. The real couple photograph and fonts are local assets. No external service is required to view the invitation. FormSubmit is configured for **nshimiye003@gmail.com**, restored after the owner confirmed successful testing and correct email details at their own inbox. No API key is required.

## Configure the wedding

See [the current hero, envelope and RSVP update](docs/HERO_AND_EMAIL_UPDATE.md) and [email setup](docs/RSVP_AND_EMAIL.md). Earlier redesign and civil-wedding reports describe previous implementations.

Edit [`src/lib/wedding-config.ts`](src/lib/wedding-config.ts). It is the typed source of truth for names, date, venue, timezone, ceremony times, optional story/programme, photos, music and configuration status. Unconfirmed values are `null` or empty arrays.

The hero uses the original `public/images/couple.jpeg` on both phones and desktop screens, with a dark graduated overlay for readable copy. Its countdown targets the confirmed wedding ceremony at 3:00 PM in Kigali (13:00 UTC) on 17 December. The itinerary includes the reception at 4:30 PM. The calendar download contains two correctly timed events with their own venues; no unconfirmed end time is invented. Every full page load or refresh presents the envelope again, and completing or skipping it returns to the hero.

No dress code, family names, guest deadline, relationship history or accommodation prices have been invented. Supply approved details before enabling the relevant sections. See [`docs/CLIENT_DETAILS_PENDING.md`](docs/CLIENT_DETAILS_PENDING.md).

## RSVP email setup

The form uses **FormSubmit**, configured for the restored client inbox **nshimiye003@gmail.com**. Both browser and server validate inputs. `POST /api/rsvp` prepares fixed recipient endpoints and readable attendance/accommodation fields; it makes no outbound email request and never reports a submission as sent. The browser then calls FormSubmit's documented AJAX endpoint directly, avoiding the server-to-server request that returned HTTP 403 on Vercel. Inline confirmation appears only after explicit provider success. The notification uses the table template and wedding subject.

After explicit provider rejection, **Continue with verification** opens FormSubmit's CAPTCHA in a new tab, retaining the same validated details and reference. Guests see confirmation on FormSubmit; opening the tab does not confirm the RSVP. Safe support codes expose the provider HTTP status without guest data. No API key, owned domain or database is required.

The owner confirmed receipt and correct accommodation details from a real live-browser test, then requested restoring the client inbox. Both inbox activations were confirmed earlier. Actual receipt at the client after restoration still needs confirmation. [Testing record and data flow](docs/RSVP_AND_EMAIL.md).

Set `FORMSUBMIT_RECIPIENT` to override the client default. If Vercel has an override, it must also use `nshimiye003@gmail.com`; no override is needed for the restored source default. Production and development use the same real sending flow. Automated tests intercept both preparation and external delivery and do not send emails. The old preview banner and Resend/Supabase setup remain removed. WhatsApp uses the confirmed host number, +250788408241.

Provider acceptance does not prove inbox delivery. FormSubmit documents a 30-day archive; the website stores no separate guest database. A busy guard prevents concurrent sends in the form, and retries of unchanged details use the same email reference. There is no provider-wide idempotency guarantee or server delivery cache. See the setup document for details.

## Photos and music

Five newly supplied photographs are now used from `public/images/moments/`, alongside the original `public/images/couple.jpeg`. Original filenames and source files are preserved. `photography.hero` and `photography.mobileHero` both use the approved `couple.jpeg`; `photography.couple` and `photography.story` select the introduction collage. The four-entry `photos` array drives the editorial gallery and accessible lightbox. Images keep their natural aspect ratio except deliberate hero background cropping. See [the complete visual asset inventory](docs/ASSET_INVENTORY.md).

All nine original added photos remain unchanged in `client-assets/pending-review/`, outside the public web root and ignored by Git. Five suitable photographs were copied with identical content and original filenames into the invitation; unrelated or sensitive compositions are not included. Add future approved photographs to configuration without duplicating gallery entries.

The soundtrack is **Intashyo — Chacha Imfurikeye ft. Fox Makare**, using the client-supplied MP3 in `public/audio/`. Opening the envelope starts native audio playback synchronously from the opening click or key interaction. Page load and Skip do not start playback. The floating control pauses and resumes the same looping audio element, with a manual retry if the browser blocks playback. No video window or YouTube requests are used. The previous Perfect MP3 remains as an unused asset. The Visit Rwanda guide link is larger and bold, with a contrasting gold background and border.

## WhatsApp and sharing

WhatsApp RSVP uses the confirmed number **+250788408241**. If it changes, set `NEXT_PUBLIC_HOST_WHATSAPP` to the replacement international number (digits, including country code), then restart/rebuild. The action becomes available when the guest has completed valid RSVP details. It prepares an encoded message from the reviewed response; opening it does not store the RSVP or prove the guest sent a message.

Set `NEXT_PUBLIC_BASE_URL` only when the actual deployment origin is known, such as the final HTTPS domain. It supplies canonical/social metadata and the server's allowed origin. In local development leave it blank to use the request origin. If set, it must match the browser's exact origin: `localhost` and `127.0.0.1` differ.

The generated `/opengraph-image` PNG, wedding title/description, Twitter card, S&D favicon, and robots noindex support private invitation sharing. Validate WhatsApp's link preview after configuring the real HTTPS origin. The project does not assume or register a domain.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Browser tests use installed Google Chrome through Playwright (`channel: "chrome"`). On another computer, install Google Chrome or run `npx playwright install chrome`. They launch/reuse the local development server. The tests cover repeated envelope openings, required animation phases, keyboard/reduced-motion/skip/replay paths, the continuous RSVP branches, gallery/swipe/calendar, music user-gesture dispatch, mobile navigation, and 320×568, 390×844, 768×1024, 1024×768, 1440×1000 and 844×390 layouts. No live guest submissions are sent by browser tests; the RSVP endpoint is mocked. Screenshots and failure traces are in `test-results/`; the HTML report is in `playwright-report/`.

Current redesign results, changed files, screenshots and honest verification limits are recorded in [`docs/REDESIGN_REPORT.md`](docs/REDESIGN_REPORT.md) and [`docs/IMPLEMENTATION_REPORT.md`](docs/IMPLEMENTATION_REPORT.md).

## Prepare for Vercel

The root `vercel.json` explicitly selects Next.js, runs `npm run build`, and resets the output directory to the framework default. In Vercel, keep Root Directory at the repository root (blank), rather than `src` or `public`. Serving only `public` exposes images but leaves the homepage and API routes returning 404. Redeploy the latest `main` commit after changing project settings.

Configure production environment variables in Vercel's project settings. Set the real `NEXT_PUBLIC_BASE_URL`, optionally set the client recipient override, and provide the correct WhatsApp contact only if that secondary action is desired.

Before accepting responses, have the client activate FormSubmit and confirm delivery from the deployed invitation. The route includes a bounded per-instance abuse guard; configure Vercel firewall protection for deployment-wide limits. On another host, overwrite `x-real-ip` at a trusted reverse proxy. See the email setup document for data retention and delivery limits.

To run the production build locally:

```bash
npm run build
npm start
```

## Project map

```text
src/app/                     Page, metadata, global tokens and server routes
src/components/envelope/     Animated envelope, invitation card and wax seal
src/components/invitation/   Hero, formal invitation, date, story, venue, gallery, closing
src/components/rsvp/         Conditional form, review and response states
src/components/shared/       Ornaments, navigation, falling hearts, reveals and music
src/lib/wedding-config.ts    Typed client-confirmed details
src/lib/calendar/            Date, timezone and ICS helpers
src/lib/validation/          Shared client/server Zod schemas
src/lib/notifications/       FormSubmit preparation, browser delivery and abuse guard
tests/                       Unit, API and browser verification
docs/                        Requirements, design, animation, data and handoff
public/images/               Original photograph and five added photographs
public/images/experiences/   Optimized Rwanda activity photographs
public/audio/                Supplied Intashyo MP3 and previous soundtrack
```

## Current guest experience

Every full load starts with an ivory envelope already present in the server-rendered page, covering restored scroll positions before JavaScript loads. Opening or skipping starts at the hero. Without JavaScript, the envelope is hidden and wedding details remain readable.

The hero uses `couple.jpeg` on phones and large screens. Desktop framing is bounded independently of the hero's text, removing the previous extra zoom and keeping both faces above the invitation copy. Desktop navigation remains available. The countdown targets the confirmed wedding ceremony at 3:00 PM in Kigali.

RSVP is one continuous form. Attendance reveals the applicable accommodation question; Yes reveals stay preferences. Values survive toggling, inactive details are cleared from the payload, and responses appear inline. Success means FormSubmit accepted the submission. The form has no preview/test branch and unavailable WhatsApp controls are hidden.

Guests attending the wedding can choose any number of four Rwanda experiences before writing their message. These interests appear in the submitted review, prepared WhatsApp message, and both FormSubmit delivery paths. The form offers only definite accommodation choices. See [the invitation update](docs/INVITATION_EXPERIENCES_UPDATE.md) for sources and verification.
