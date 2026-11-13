# Invitation and Rwanda experiences update

Requested changes:

- The soundtrack is Intashyo — Chacha Imfurikeye ft. Fox Makare, using the client-supplied MP3 in `public/audio/`.
- Reception starts at **4:30 PM, Africa/Kigali**, including invitation copy, itinerary, calendar, venue, and sharing metadata. Ceremony remains at 3:00 PM.
- Guest-facing wording uses Wedding / Wedding Ceremony. Existing calendar UIDs are retained so earlier downloads refer to the same events.
- Removed “I'm not sure yet”, “No preference”, “Either is fine”, and “I'll share with my own group” from both form options and server validation.
- Attending guests can select multiple optional Rwanda experiences before the couple's message. Interests survive local attendance toggles, are omitted when declining, and appear in the review, WhatsApp text, AJAX email fields and CAPTCHA fallback fields.

## Soundtrack

Opening the envelope calls native audio playback synchronously within the opening click or key event. One looping audio element stays mounted while guests browse. The floating control pauses and resumes the same track, and failed playback offers a manual retry. Page load and Skip do not start music. The client-supplied file is preserved with its original filename. The YouTube player, API loader, video-window styles and obsolete tests have been removed.

“Explore Rwanda with Visit Rwanda” is now a 22px bold link with a contrasting ivory-gold background, gold border, generous padding and a visible keyboard focus outline. It wraps within narrow mobile screens.

## Experiences and images

Activity ideas and photographs are from [Visit Rwanda's experiences guide](https://visitrwanda.com/three-day-experiences/). No trip dates, prices, included services or confirmed bookings are promised. Guests express interest; arrangements and costs are shared separately.

Images are resized to 640 × 400 WebP, served locally with Next Image, and used decoratively inside cards labelled by activity. Original sources:

- Lake Kivu: https://visitrwanda.com/wp-content/uploads/2018/08/Visit-Rwanda-Karongi-Lake-Kivu-at-Sunset-1.jpg
- Akagera: https://visitrwanda.com/wp-content/uploads/2026/03/Boat-Safari-in-Akagera-National-Park-with-Magashi-Camp-by-Wilderness-Safaris1.jpg
- Nyungwe: https://visitrwanda.com/wp-content/uploads/2022/05/OO_NyungweHouse_Lifestyle_Canopy_Walk_0019B_UPDATE_MASTER-1024x683.jpg
- Gorillas: https://visitrwanda.com/wp-content/uploads/2026/03/Amahoro-Gorilla-group-1-1-1024x576.jpg

## Verification

Existing native-audio tests cover user-gesture playback, rejected playback, retries and synchronization with real media events. The browser playback scenario uses the actual supplied MP3 and verifies that opening starts playback, pause/resume preserves position, and no video or YouTube requests appear. Responsive checks cover the larger guide link on narrow phones and desktop. Automated RSVP requests remain intercepted and do not send email.

- 71 unit and integration tests passed across nine files.
- ESLint and the production build passed, including the build's TypeScript checks.
- Seven targeted Chrome browser checks passed: envelope lifecycle, skip/Escape/reduced-motion behavior, synchronous music requests, actual MP3 playback and pause/resume, and 320px, 390px and 1440px layouts.
- Updated [desktop](screenshots/experiences/desktop.png) and [mobile](screenshots/experiences/mobile.png) previews show the guide link at 22px and font weight 700 without horizontal overflow.
