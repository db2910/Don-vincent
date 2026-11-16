# Discover Rwanda and enhanced photographs

Owner feedback implemented on 16 November 2026:

- Added a standalone Travel & Accommodation section, then Discover Rwanda, then the wedding RSVP.
- Featured gorilla trekking in Volcanoes National Park, Akagera safari, the Kigali Genocide Memorial, and outdoor adventures in the requested order. Cards use two columns on desktop and one on phones, short descriptions, location/time information, and Explore Experience links.
- Removed experience checkboxes, form state, validation fields, email fields and WhatsApp fields. Travel planning is independent of wedding attendance.
- Retained the bold, contrasting Visit Rwanda guide link in the new Planning Your Stay panel.
- Added navigation links for Travel & stay and Discover Rwanda. The compact menu now starts at 1200px to fit the additional links without reducing their text size.

## Official destination references

Checked on 16 November 2026:

- Gorilla trekking: https://visitrwandabookings.rdb.rw/rdbportal/mountain-gorilla-tracking
- Akagera: https://visitrwanda.com/destinations/akagera-national-park-2/
- Kigali Genocide Memorial: https://kgm.rw/visit/
- Outdoor adventure information: https://visitrwanda.com/tourism/interests/sports-adventure/
- Travel information: https://visitrwanda.com/practical-information/
- General inspiration: https://visitrwanda.com/

Gorilla trekking is labelled Volcanoes National Park, Rwanda. Duration suggestions come from the owner's approved brief; they are not fixed itineraries. No prices, departures or guaranteed wildlife sightings are promised. The adventure card links to general Visit Rwanda information, with no individual activity booking links.

## Photo mapping

The enhanced landscape photograph `WhatsApp Image 2026-11-16 at 10.42.17.jpeg` replaces the earlier indoor white-and-gold portrait in the gallery and is the main couple-feature photo. The enhanced embracing portrait `WhatsApp Image 2026-11-16 at 10.42.17 (1).jpeg` appears in the gallery and is the smaller couple-feature photo; its older version stays unused. The caption reserves space beside the smaller portrait. The hero remains `couple.jpeg`, which has no matching enhanced upload. Supplied assets and original filenames remain intact; older files remain available but the replaced shots are not repeated in the gallery.

Activity image sources:

- Gorillas: https://visitrwanda.com/wp-content/uploads/2026/03/Amahoro-Gorilla-group-1-1-1024x576.jpg
- Akagera: https://visitrwanda.com/wp-content/uploads/2026/03/Boat-Safari-in-Akagera-National-Park-with-Magashi-Camp-by-Wilderness-Safaris1.jpg
- Memorial gardens: https://kgm.rw/wp-content/uploads/2023/05/Memorial-Gardens-26512247736_72419c6fb6_o-scaled-e1685962601420.webp
- Zipline photography: https://www.fazenda.rw/web/image/22315-50b49dc8/ZIPLINE1.webp

Images are served locally as optimized WebP assets with descriptive alt text. The zipline photograph shows the activity; it does not imply that the wedding hosts have selected a provider.

## Verification

Automated RSVP tests intercept preparation and delivery requests and send no email. Tests verify that travel interests are absent from the RSVP, email and WhatsApp reply, and that Discover Rwanda links and section placement work independently of the form. Native audio and gallery checks protect the existing invitation behavior.

- 71 unit and integration tests passed across nine files.
- 12 targeted browser checks passed, covering section placement, official links, RSVP submission for all attendance/accommodation branches, native MP3 playback, gallery/lightbox/calendar behavior, and six responsive layouts (320, 390, 768, 1024, 1440 and 844px).
- ESLint and the production build passed, including TypeScript validation.
- Production smoke checks at 1440px and 390px verified both enhanced images load, no form checkboxes remain, no horizontal overflow, and no browser console errors. [Discover Rwanda desktop](screenshots/experiences/desktop.png), [mobile](screenshots/experiences/mobile.png), and [enhanced couple feature](screenshots/experiences/enhanced-couple-mobile.png) previews are included.
