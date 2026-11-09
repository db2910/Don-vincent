# Photograph and audio inventory

Reviewed for the November 8, 2026 redesign. All nine new photographs in `client-assets/pending-review/` and the existing `public/images/couple.jpeg` were opened and visually inspected. Dimensions and formats were read from the files with Sharp. Descriptions report visible content; they do not assign identities to other people or invent occasions or relationship history.

## Source photographs

| Original filename | Format | Dimensions | Width ÷ height | Visible content | Recommended use |
| --- | --- | --- | --- | --- | --- |
| `WhatsApp Image 2026-11-06 at 12.04.15 (1).jpeg` | JPEG | 420 × 540 | 0.778; portrait | Head-and-shoulders portrait of a woman against a white background, wearing a black and cream patterned top. | Keep as supplied; the two-person photographs make a stronger couple introduction. Not selected for public use. |
| `WhatsApp Image 2026-11-06 at 12.04.15.jpeg` | JPEG | 1280 × 847 | 1.511; landscape | Couple standing close together indoors, smiling, in yellow patterned and white clothing; other guests and event furniture are visible behind them. | Strongest new landscape hero: both faces are clear in the upper third. Use a warm overlay and place most copy below the faces. |
| `WhatsApp Image 2026-11-06 at 12.04.16 (1).jpeg` | JPEG | 960 × 1280 | 0.750; 3:4 portrait | Couple embracing and smiling in a bright interior; one wears white and holds a phone, the other wears black. | Distinct couple introduction or story photograph; preserve the portrait composition and embrace. |
| `WhatsApp Image 2026-11-06 at 12.04.16.jpeg` | JPEG | 1280 × 847 | 1.511; landscape | Couple in yellow patterned and white clothing, smiling; one is looking sideways; people and a wood-panelled interior are behind them. | Landscape gallery photograph. This is a different frame from `12.04.15.jpeg`, with a different pose and gaze. |
| `WhatsApp Image 2026-11-06 at 12.04.17 (1).jpeg` | JPEG | 1280 × 960 | 1.333; 4:3 landscape | Close group selfie of two adults and a child seated in a car. | Preserve in the source folder. Not selected for the couple-focused invitation gallery. Do not invent family relationships. |
| `WhatsApp Image 2026-11-06 at 12.04.17.jpeg` | JPEG | 1280 × 1049 | 1.220; landscape | A woman seated in bed holding an infant, with a man standing beside her and holding her hand; bedding and personal items are visible. | Preserve in the source folder. Not selected for the public wedding design; other photographs are stronger invitation material. Do not infer an event or health circumstances. |
| `WhatsApp Image 2026-11-06 at 12.04.18.jpeg` | JPEG | 959 × 1280 | 0.749; portrait | Close smiling couple selfie indoors, one wearing sunglasses, with framed art behind them. | Intimate supporting gallery photograph. Keep the whole image visible in the lightbox and avoid a tight landscape crop. |
| `WhatsApp Image 2026-11-06 at 12.04.20.jpeg` | JPEG | 425 × 555 | 0.766; portrait | Head-and-shoulders portrait of a child in a floral top against a white background. | Preserve in the source folder. Not selected for the couple-focused public invitation. |
| `WhatsApp Image 2026-11-06 at 12.04.21.jpeg` | JPEG | 960 × 1280 | 0.750; 3:4 portrait | Couple standing together under gold, ivory and turquoise balloons, with pale flowers in the foreground. | Portrait gallery/supporting photograph; also suitable for an art-directed mobile hero because both faces fit the narrow composition. Do not label the occasion without supplied context. |
| `couple.jpeg` | JPEG | 1600 × 1066 | 1.501; landscape | Existing close couple portrait in blue clothing; the supplied image contains a white surround and fine black border. | Supporting story or closing photograph, or full-image gallery presentation. Avoid treating the baked-in border as CSS or stretching the image. |

## Public copies and composition

The user explicitly requested use of the new photographs in the redesign. Five suitable two-person photographs were copied byte-for-byte to `public/images/moments/` with their original filenames:

- `WhatsApp Image 2026-11-06 at 12.04.15.jpeg`
- `WhatsApp Image 2026-11-06 at 12.04.16 (1).jpeg`
- `WhatsApp Image 2026-11-06 at 12.04.16.jpeg`
- `WhatsApp Image 2026-11-06 at 12.04.18.jpeg`
- `WhatsApp Image 2026-11-06 at 12.04.21.jpeg`

Originals remain unchanged in `client-assets/pending-review/`; none were renamed or deleted. SHA-256 comparisons confirmed each public copy matches its source. The existing `public/images/couple.jpeg` remains unchanged.

Use Next.js `Image` with the measured dimensions for content photographs and `fill` plus responsive `sizes` for the hero. The landscape hero's faces are in the upper third; retain that area with responsive `object-position`. On narrow, tall screens a landscape `cover` crop can remove one person's face. The portrait balloon photograph provides an alternative mobile composition, or the landscape image requires careful narrow-screen positioning and a hero aspect ratio that preserves both faces. Overlay text should sit below or beside the faces. Gallery lightbox images should use `object-fit: contain`; portrait tiles should retain sufficient height rather than squeezing every photograph into a wide card.

The recommended distribution is the new landscape photograph for the hero, the indoor embrace for the couple introduction, the original blue-clothing photograph for the story/closing composition, and the remaining distinct new frames in the gallery. The final typed configuration is the authoritative list of displayed photographs and their placement. Do not repeat a photo to create additional gallery entries.

## Audio search

No audio file was found in the project. The audit searched tracked and untracked project files, including hidden paths, while excluding dependencies, Git internals, build output, screenshots and test reports. Supported-extension checks included MP3, WAV, OGG, M4A, AAC, FLAC, OPUS, AIF/AIFF, WMA and common MP4/WebM media containers. The source asset folder contains only the nine JPEG photographs above.

The missing asset is a host-approved, licensed wedding song, preferably an MP3 placed under `public/audio/` with its exact path and display title configured centrally in `src/lib/wedding-config.ts`. No audio was generated, downloaded, copied from another project, or represented as present. Until that file is supplied, the music component must report an unavailable/unconfigured state rather than claim playback. Once configured, envelope activation should call `play()` within the same user gesture; playback UI must follow the media events and promise result, with manual retry if browser policy blocks it.

## Other image files

`docs/screenshots/` and `test-results/` contain rendered application screenshots and browser-test artifacts. These are implementation evidence, not wedding photographs, and must not be used as invitation imagery. The application icon is an SVG. No additional source-photo or video file was found outside the ten photograph entries above.

## Final placement after browser composition review

The portrait embrace (`12.04.16 (1).jpeg`) is used as the mobile hero: its faces sit high enough to leave readable space for names, countdown and RSVP beneath them. The desktop hero uses `12.04.15.jpeg`. The couple introduction uses the full portrait beneath balloons (`12.04.21.jpeg`), with the `12.04.18.jpeg` selfie as the inset story/support image. The gallery contains four distinct entries: `12.04.16.jpeg`, `12.04.18.jpeg`, `12.04.21.jpeg`, and the original `couple.jpeg`. Each gallery source appears once. Reuse across hero/introduction/gallery is intentional, with five new photographs distributed throughout the page rather than one image everywhere.

The hero uses an optimized `<picture>` with a portrait source below 700px, a shared descriptive alt for both compositions, eager/high-priority loading, and responsive Next.js source sets. It avoids preloading the desktop-only photograph on phones. Content/gallery photos use measured dimensions and natural heights; lower sections load lazily.

## Current civil wedding update — 10 November 2026

This update supersedes the earlier hero and audio recommendations above. The host specifically selected `public/images/couple.jpeg` for both desktop and mobile. The mobile photograph fades into the dark hero background so both faces and the copy stay legible. Other approved photographs remain in the introduction and gallery.

The supplied `public/audio/perfect.mp3` (5,427,883 bytes) is a valid MPEG Layer III audio file and is configured as Perfect — Ed Sheeran. Native audio playback, pause and resume are checked in a real browser. No external music service is needed.
