# Discover Rwanda and enhanced photographs

Owner feedback implemented on 16 November 2026:

- Added a standalone Travel & Accommodation section, then Discover Rwanda, then the wedding RSVP.
- Featured gorilla trekking in Volcanoes National Park, Akagera safari, the Kigali Genocide Memorial, and outdoor adventures in the requested order. Cards use two columns on desktop and one on phones, short descriptions, location/time information, and Explore Experience links.
- Discover Rwanda stays visually separate from the RSVP and has optional checkboxes on each card. Multiple selections share state with the RSVP through GuestResponse and appear in the same owner email table under “Rwanda experiences”, the submitted reply and the WhatsApp message. Choices lock during submission and after success, and unlock after a failed send.
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

Automated RSVP tests intercept preparation and delivery requests and send no email. Tests verify that multiple checkbox selections flow from the separate Discover Rwanda section into the validated RSVP, owner email table, submitted review and WhatsApp reply. API tests check the actual table fields in both AJAX and CAPTCHA delivery paths. Native audio and gallery checks protect the existing invitation behavior.

- 72 unit and integration tests passed across nine files, including the shared checkbox/RSVP journey and actual API table preparation.
- The standalone layout was verified across six sizes. Seven checkbox-update browser scenarios passed, including selecting multiple activities with mouse and keyboard, submitting them with RSVP, showing them in the submitted review, locking selections after success, and 320px, 390px and 1440px layouts. The 390px check passed on rerun after a timing interruption.
- ESLint and the production build passed, including TypeScript validation.
- Production smoke checks at 1440px and 390px verified selected checkboxes, matching selected-experience rows in AJAX and CAPTCHA table preparations, no horizontal overflow and no browser console errors. The local preparation check did not send email. [Discover Rwanda desktop](screenshots/experiences/desktop.png), [mobile](screenshots/experiences/mobile.png), and [enhanced couple feature](screenshots/experiences/enhanced-couple-mobile.png) previews are included.
