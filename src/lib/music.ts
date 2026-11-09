/** Dispatch synchronously from the opening click, preserving the browser user gesture. */
export const INVITATION_MUSIC_EVENT = "sd:request-wedding-music";
export const INVITATION_REVEALED_EVENT = "sd:invitation-revealed";
export function requestInvitationMusic() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(INVITATION_MUSIC_EVENT));
}
