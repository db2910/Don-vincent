# Discover Rwanda and enhanced photographs

Owner feedback updated on 17 November 2026:

- The photo gallery is followed by the wedding RSVP details, optional Discover Rwanda experiences, and one final Send My RSVP button. A Skip experiences and send RSVP link jumps from the end of the wedding details to the final send panel without submitting. The Travel & Accommodation section and its navigation link remain removed.
- Featured gorilla trekking in Volcanoes National Park, Akagera safari, the Kigali Genocide Memorial, and outdoor adventures in the requested order. Cards use two columns on desktop and one on phones, short descriptions, location/time information, and Explore Experience links.
- Discover Rwanda stays visually separate from the wedding details and has optional checkboxes on each card. Multiple selections share state with the RSVP through GuestResponse and appear in the same owner email table under “Rwanda experiences”, the submitted reply and the WhatsApp message. The checkboxes and final send button use the native `form` attribute to associate with `wedding-rsvp-form`. Choices lock during submission and after success, and unlock after a failed send. Validation errors focus the wedding details; confirmation and submitted review appear in the final send panel.
- Removed both the Planning Your Stay panel and the general Explore Rwanda with Visit Rwanda button. Each experience retains its individual Explore Experience link.
- Added a Discover Rwanda navigation link. The compact menu starts at 1200px to fit the links without reducing their text size.

## Official destination references

Checked on 16 November 2026:

- Gorilla trekking: https://visitrwandabookings.rdb.rw/rdbportal/mountain-gorilla-tracking
- Akagera: https://visitrwanda.com/destinations/akagera-national-park-2/
- Kigali Genocide Memorial: https://kgm.rw/visit/
- Outdoor adventure information: https://visitrwanda.com/tourism/interests/sports-adventure/

Gorilla trekking is labelled Volcanoes National Park, Rwanda. Duration suggestions come from the owner's approved brief; they are not fixed itineraries. No prices, departures or guaranteed wildlife sightings are promised. The adventure card links to general Visit Rwanda information, with no individual activity booking links.

## Photo mapping

The enhanced landscape photograph `WhatsApp Image 2026-11-16 at 10.42.17.jpeg` replaces the earlier indoor white-and-gold portrait in the gallery and is the main couple-feature photo. The enhanced embracing portrait `WhatsApp Image 2026-11-16 at 10.42.17 (1).jpeg` appears in the gallery and is the smaller couple-feature photo; its older version stays unused. The caption reserves space beside the smaller portrait. The hero remains `couple.jpeg`, which has no matching enhanced upload. Supplied assets and original filenames remain intact; older files remain available but the replaced shots are not repeated in the gallery.

Activity image sources:

- Gorillas: https://visitrwanda.com/wp-content/uploads/2026/03/Amahoro-Gorilla-group-1-1-1024x576.jpg
- Akagera lioness, replacing the boat/lake photo: https://visitrwanda.com/wp-content/uploads/fly-images/1396/Visit-Rwanda-Akagera-Lion-in-Tree-1920x1280.jpg (Matthew Poole; the visible photographer credit is preserved).
- Kwibuka Flame of Remembrance: owner's supplied `public/images/kwibuka .jpeg`, served as `public/images/experiences/kwibuka.webp`. The original upload is preserved. This replaces the previous memorial building photograph.
- Zipline photography: https://www.fazenda.rw/web/image/22315-50b49dc8/ZIPLINE1.webp

Images are served locally as optimized WebP assets with descriptive alt text. The zipline photograph shows the activity; it does not imply that the wedding hosts have selected a provider.

## Verification

- 72 unit/integration tests passed across nine files. The shared guest journey checks wedding details before optional experiences, one final button associated with the wedding form, multiple selections in native FormData, selected IDs in the JSON payload, readable WhatsApp text and locked choices after success. API tests verify the owner email table fields in both AJAX and CAPTCHA delivery preparations.
- Ten browser scenarios passed across the initial run and targeted recheck: multiple experience selections; skipping all experiences; validation focus and a wedding-only reply; all three attendance/accommodation paths; retry after activation failure; CAPTCHA fallback; and image loading/layout at 320px, 390px and 1440px. The recheck scoped the alert assertion to the RSVP section to exclude Next.js's route announcer and gave the longer selection journey a 60-second test budget.
- ESLint and the production build passed, including TypeScript validation.
- A production browser smoke check verified the layout at 1440px and 390px, native checkbox/button form association, and a click on the final submit button through the actual local preparation API. Both AJAX and CAPTCHA preparations contain the same selected-experience row with the table email template. Provider delivery was intercepted locally and returned a fixture response; no email was sent. There was no horizontal overflow or browser console error.

Previews: [complete RSVP-first flow on desktop](screenshots/experiences/wedding-first-desktop.png), [complete flow on mobile](screenshots/experiences/wedding-first-mobile.png), [experience cards on desktop](screenshots/experiences/desktop.png), [experience cards on mobile](screenshots/experiences/mobile.png), and [enhanced couple feature](screenshots/experiences/enhanced-couple-mobile.png).
