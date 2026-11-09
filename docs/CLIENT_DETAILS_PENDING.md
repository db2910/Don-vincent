# Client details pending

Confirmed: Shee Salamata & Don Vincent; Gusaba Wedding; Thursday, 17 December 2026; Kigali Serena Hotel; Africa/Kigali; S & D. Added photographs are explicitly authorized by the redesign brief and now incorporated.

| Pending detail | Current behavior | Configuration / action |
| --- | --- | --- |
| Ceremony start/end | Provisional hero countdown to the beginning of 17 December in Kigali; labelled date countdown, ceremony time unconfirmed. Calendar remains all-day. | Set confirmed `startTime`/`endTime` in HH:mm Kigali time. `countdown.useDateBeginningWhenTimeUnknown` controls the provisional target. |
| RSVP deadline | Omitted | Set approved `rsvpDeadline`. |
| Host WhatsApp | Secondary action disabled with explanation | Set verified `NEXT_PUBLIC_HOST_WHATSAPP`. |
| Host notification sender/recipient | No recipient invented; no real email sent | Set Resend credentials, verified sender, recipient and retry secret. |
| Approved wedding song | None found; player hidden, full gesture-based system ready | Place the approved audio in `public/audio/`; set `music.src` and `music.title`. Opening click requests playback; blocked audio can be retried manually. |
| Biography, programme, extra family names, dress code | Not invented | Supply approved content before adding it. |
| Accommodation rates | No quotes, price limits or booking claims | Guest preferences are for planning only. |
| Domain | No invented canonical URL | Set actual `NEXT_PUBLIC_BASE_URL` before launch. |
| Database credentials and privacy retention date | Development preview is explicitly unpersisted; production fails safely until configured | Apply migration in staging, verify RLS/concurrency, configure production secrets and agree retention/deletion with hosts. |

The audio scan found no MP3, WAV, OGG, M4A, AAC, FLAC, Opus or similar file. `public/audio/wedding-song.mp3` is a suggested future path, not an existing or fabricated song.

All nine original new photos remain unchanged under `client-assets/pending-review/`. Five suitable two-person compositions are copied byte-for-byte, with original filenames, into `public/images/moments/`. The desktop hero uses 12.04.15, phone hero 12.04.16 (1), couple introduction 12.04.21, supporting collage 12.04.18, and gallery 12.04.16/18/21 plus the original `couple.jpeg`. The other originals remain outside public hosting. Full descriptions, measurements and rationale are in `ASSET_INVENTORY.md`.
