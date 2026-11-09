# Confirmed details and remaining setup

Confirmed: Shee Salamata & Don Vincent; Civil Wedding; Thursday, 17 December 2026; civil marriage at City Hall at 3:00 PM; reception at Kigali Serena Hotel at 4:00 PM; Africa/Kigali; S & D.

The itinerary shows these two events only. The hero uses `couple.jpeg` on every screen size. The countdown targets the ceremony, and the calendar includes separate, correctly timed ceremony and reception events. End times have not been supplied and are omitted.

The host supplied `public/audio/perfect.mp3` and selected Perfect by Ed Sheeran. Its floating play/pause control is enabled; the envelope opening requests playback through a user gesture. Refresh always returns to a fresh envelope.

The notification recipient was supplied privately. Configure it in the server-only `RSVP_NOTIFICATION_TO` variable, alongside the Resend key, verified sender, retry secret, Supabase credentials and rate-limit secret. A private scheduler must invoke the existing notification retry endpoint. No email credentials, database credentials or recipient address are included in the public client configuration.

Still pending: RSVP deadline, host WhatsApp number, exact City Hall address if directions are needed, event end times, biography, extra family names, dress code, database/email provisioning and agreed data retention. Accommodation preferences remain planning requests, not bookings or price quotes.

The other approved photographs remain in the introduction collage and gallery. Unselected originals stay in ignored `client-assets/pending-review/` and are not publicly hosted.
