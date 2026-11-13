# Invitation and Rwanda experiences update

Requested changes:

- The soundtrack is [Intashyo — Chacha Imfurikeye ft. Fox Makare](https://www.youtube.com/watch?v=5jfgdZlA7Pk), confirmed using YouTube's oEmbed metadata.
- Reception starts at **4:30 PM, Africa/Kigali**, including invitation copy, itinerary, calendar, venue, and sharing metadata. Ceremony remains at 3:00 PM.
- Guest-facing wording uses Wedding / Wedding Ceremony. Existing calendar UIDs are retained so earlier downloads refer to the same events.
- Removed “I'm not sure yet”, “No preference”, “Either is fine”, and “I'll share with my own group” from both form options and server validation.
- Attending guests can select multiple optional Rwanda experiences before the couple's message. Interests survive local attendance toggles, are omitted when declining, and appear in the review, WhatsApp text, AJAX email fields and CAPTCHA fallback fields.

## Soundtrack

The official YouTube IFrame API loads only after opening the envelope or clicking Play. The player remains visible while active, supports pause/resume and a close-and-stop control, and follows real playback state. A blocked-autoplay prompt and direct song link cover browser/provider restrictions. No YouTube audio is downloaded or copied into the repository. Native audio support remains available through `music.src` when no YouTube video ID is configured.

## Experiences and images

Activity ideas and photographs are from [Visit Rwanda's experiences guide](https://visitrwanda.com/three-day-experiences/). No trip dates, prices, included services or confirmed bookings are promised. Guests express interest; arrangements and costs are shared separately.

Images are resized to 640 × 400 WebP, served locally with Next Image, and used decoratively inside cards labelled by activity. Original sources:

- Lake Kivu: https://visitrwanda.com/wp-content/uploads/2018/08/Visit-Rwanda-Karongi-Lake-Kivu-at-Sunset-1.jpg
- Akagera: https://visitrwanda.com/wp-content/uploads/2026/03/Boat-Safari-in-Akagera-National-Park-with-Magashi-Camp-by-Wilderness-Safaris1.jpg
- Nyungwe: https://visitrwanda.com/wp-content/uploads/2022/05/OO_NyungweHouse_Lifestyle_Canopy_Walk_0019B_UPDATE_MASTER-1024x683.jpg
- Gorillas: https://visitrwanda.com/wp-content/uploads/2026/03/Amahoro-Gorilla-group-1-1-1024x576.jpg

## Verification

The initial unit run found four existing component-test failures: success fixtures still returned the old direct submission response. Fixtures now emulate the existing preparation and browser-delivery contract, without bypassing production validation.

Tests cover removed options, optional/multiple/duplicate/invalid experience choices, attendance switching, email and WhatsApp fields, calendar timing and YouTube player state/error handling. Browser checks include keyboard selection and six viewport sizes. Automated RSVP requests are intercepted and do not send email.

Validation on 13 November 2026:

- `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- `npm test -- --maxWorkers=1 --reporter=dot`: 74 passed across 10 files. The single-worker run avoids local resource contention seen while the production build and browsers were also running.
- Production-server smoke checks at 1440 × 1000 and 390 × 844 had no console errors or horizontal overflow. [Desktop cards](screenshots/experiences/desktop.png) and [mobile cards](screenshots/experiences/mobile.png) show multiple selected interests.
- Live Chrome playback of the actual YouTube song was verified on mobile-sized and desktop viewports. Desktop playback advanced, paused at about 1.99 seconds, resumed at about 2.66 seconds, and removed the iframe when closed.
- Layout/envelope browser tests intercept the YouTube script so video-provider timing cannot affect animation snapshots. Player failures and controls are covered separately. The pre-hydration screenshot keeps the original caret styles to avoid introducing a test-only hydration mismatch.
- All 23 distinct browser scenarios were validated: the first run passed 21, with two envelope snapshot timing failures under local load. A targeted rerun of both failures and the pre-hydration screenshot passed all three checks. Responsive checks cover 320 × 568, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 1000 and 844 × 390.
