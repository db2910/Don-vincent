# Shee Salamata & Don Vincent

An Enhanced Classic Royal Civil Wedding invitation, built with Next.js App Router, strict TypeScript, Tailwind CSS, Motion, Zod and Supabase. Thursday, **17 December 2026**: civil marriage at **City Hall, 3:00 PM**, followed by the reception at **Kigali Serena Hotel, 4:00 PM**, Africa/Kigali.

## Run locally

Use Node.js 22 or later and npm. From this folder:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open **http://127.0.0.1:3000**. The real couple photograph and fonts are local assets. No external service is required to view the invitation. With missing database credentials, development RSVP completes only an explicitly labeled preview: nothing is stored or emailed. Production fails safely with HTTP 503 when required configuration is absent.

## Configure the wedding

See [the current civil wedding update and verification](docs/CIVIL_WEDDING_UPDATE.md) for the latest behavior; it supersedes the historical redesign notes.

Edit [`src/lib/wedding-config.ts`](src/lib/wedding-config.ts). It is the typed source of truth for names, date, venue, timezone, ceremony times, optional story/programme, photos, music and configuration status. Unconfirmed values are `null` or empty arrays.

The hero uses the original `public/images/couple.jpeg` on both phones and desktop screens, with a dark graduated overlay for readable copy. Its countdown targets the confirmed civil marriage at 3:00 PM in Kigali (13:00 UTC) on 17 December. The itinerary includes the reception at 4:00 PM. The calendar download contains two correctly timed events with their own venues; no unconfirmed end time is invented. Every full page load or refresh presents the envelope again, and completing or skipping it returns to the hero.

No dress code, family names, guest deadline, relationship history or accommodation prices have been invented. Supply approved details before enabling the relevant sections. See [`docs/CLIENT_DETAILS_PENDING.md`](docs/CLIENT_DETAILS_PENDING.md).

## Supabase setup

1. Create a Supabase project owned by the hosts.
2. Apply [`supabase/migrations/202611080001_wedding_rsvp.sql`](supabase/migrations/202611080001_wedding_rsvp.sql) with the Supabase SQL editor as database owner. For the CLI workflow, link the project and use `supabase db push`.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. The service-role key must remain server-only.
4. Generate a private rate-limit secret with `openssl rand -hex 32`; put it in `RSVP_RATE_LIMIT_SECRET`.
5. Restart the development server. You are now using real persistence: only submit authorized guest responses or a controlled staging test.

The browser POSTs to `/api/rsvp`. Zod validates the request again on the server. A restricted PostgreSQL RPC atomically applies a distributed rate limit, verifies the idempotency key, saves the guest record, and creates an email outbox job. Anonymous and ordinary authenticated users cannot read or directly write guest records. No guest listing endpoint exists. View records through authorized Supabase administration.

Run staging checks for migration installation, RLS, concurrent retries and rate limits before accepting real RSVPs. The included automated tests mock external services and never send test data to client systems. Architecture, notification retries and deletion steps are in [`docs/RSVP_AND_DATABASE.md`](docs/RSVP_AND_DATABASE.md).

## Email notifications

Configure a verified Resend sender and host recipient:

```dotenv
RESEND_API_KEY=
RSVP_NOTIFICATION_FROM=
RSVP_NOTIFICATION_TO=
RSVP_NOTIFICATION_RETRY_SECRET=
```

The host has confirmed the notification recipient privately. Store that address in the server-only `RSVP_NOTIFICATION_TO` environment variable; do not embed it in client-side configuration. Persistence completes before a notification is attempted. Failed notifications do not undo or duplicate RSVPs. A protected `POST /api/notifications/retry` with `Authorization: Bearer <RSVP_NOTIFICATION_RETRY_SECRET>` processes one eligible outbox job; invoke it from a trusted scheduler. Retries are bounded and use a stable provider idempotency key. Provider acceptance does not prove final inbox delivery. Schedule/review retries before production; no background scheduler is installed automatically.

## Photos and music

Five newly supplied photographs are now used from `public/images/moments/`, alongside the original `public/images/couple.jpeg`. Original filenames and source files are preserved. `photography.hero` and `photography.mobileHero` both use the approved `couple.jpeg`; `photography.couple` and `photography.story` select the introduction collage. The four-entry `photos` array drives the editorial gallery and accessible lightbox. Images keep their natural aspect ratio except deliberate hero background cropping. See [the complete visual asset inventory](docs/ASSET_INVENTORY.md).

All nine original added photos remain unchanged in `client-assets/pending-review/`, outside the public web root and ignored by Git. Five suitable photographs were copied with identical content and original filenames into the invitation; unrelated or sensitive compositions are not included. Add future approved photographs to configuration without duplicating gallery entries.

The supplied `public/audio/perfect.mp3` is connected as **Perfect — Ed Sheeran**. The floating play/pause control includes the track title. Opening the envelope requests playback synchronously from that click/tap/key interaction, preserving the browser user gesture; page load and Skip do not start playback. Rejected playback shows a manual retry control. The single audio instance follows real play/pause/error events and stays mounted while scrolling. It hides while a form field has focus to keep typing clear.

## WhatsApp and sharing

Set `NEXT_PUBLIC_HOST_WHATSAPP` to the **verified** international host number (digits, including country code), then restart/rebuild. Until configured, the secondary WhatsApp action is disabled with an explanation. It prepares an encoded message from the reviewed response; opening it does not store the RSVP or prove the guest sent a message.

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

Configure production environment variables in Vercel's project settings. Set the real `NEXT_PUBLIC_BASE_URL`, use the hosts' Supabase project, apply the migration first, and use the correct verified email/WhatsApp contacts.

Before launching: confirm pending client details; test database/RLS and a real email with the hosts' approval in staging; verify the venue map and downloadable calendar on guest devices; configure the retry scheduler and privacy retention process; verify social previews on the real domain; review mobile accessibility and approved music licensing. The Vercel edge must supply its trusted IP header for distributed request limiting. On another host, sanitize and supply `x-real-ip` at a trusted reverse proxy.

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
src/lib/supabase/            Server-only Supabase client
src/lib/notifications/       Provider integration and outbox processing
supabase/migrations/         Private tables, constraints and atomic RPCs
tests/                       Unit, API and browser verification
docs/                        Requirements, design, animation, data and handoff
public/images/               Original photograph and five added photographs
public/audio/                Supplied Perfect MP3
```

## Current guest experience

The invitation opens from a large, named ivory envelope into a full-background photographic hero. The hero uses a portrait photograph on phones, a landscape photograph on larger screens, readable overlaid names, the provisional Kigali date countdown, and RSVP shortcut. A restrained 12-heart CSS layer occupies edge lanes; eight remain visible on phones, and reduced motion disables them.

RSVP is **one continuous form**. Choosing attendance immediately reveals the relevant accommodation question; choosing Yes reveals the preferences directly underneath. Declining hides accommodation. No/unsure need no additional stay details. Optional message and one Send My RSVP action stay in the same form. Values survive toggling, inactive details are cleared from the payload, and confirmed results appear inline. There are no wizard steps or Continue/Back buttons. Backend validation, persistence, rate limiting, idempotency, notifications and WhatsApp are preserved.
