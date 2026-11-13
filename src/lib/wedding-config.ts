export type WeddingPhoto = { src: string; alt: string; width: number; height: number; caption?: string };
export type WeddingConfig = {
  names: { first: string; second: string; combined: string };
  monogram: string; date: string; timezone: string;
  startTime: string | null; endTime: string | null; rsvpDeadline: string | null;
  venue: { name: string; mapUrl: string; embedUrl: string };
  story: string | null; photos: WeddingPhoto[];
  photography: { hero: WeddingPhoto; mobileHero: WeddingPhoto; couple: WeddingPhoto; story: WeddingPhoto };
  countdown: { useDateBeginningWhenTimeUnknown: boolean };
  programme: { title: string; time: string; location: string; description?: string }[];
  music: { src: string | null; title: string | null };
  whatsappNumber: string | null; publicBaseUrl: string | null;
  status: { ceremonyTime: "pending" | "confirmed"; story: "pending" | "confirmed"; photos: "confirmed" | "placeholder" };
};

const moment = (filename: string, alt: string, width: number, height: number, caption?: string): WeddingPhoto => ({ src: `/images/moments/${filename}`, alt, width, height, caption });
const photographs = {
  sharedSmile: moment("WhatsApp Image 2026-11-06 at 12.04.16.jpeg", "Shee Salamata and Don Vincent sharing a smile among guests indoors.", 1280, 847, "A shared smile"),
  selfie: moment("WhatsApp Image 2026-11-06 at 12.04.18.jpeg", "A close smiling selfie of Shee Salamata and Don Vincent.", 959, 1280, "Close to you"),
  balloons: moment("WhatsApp Image 2026-11-06 at 12.04.21.jpeg", "Shee Salamata and Don Vincent together beneath gold, ivory and turquoise balloons.", 960, 1280, "Moments together"),
};

/** Confirmed facts and approved photographs. Server secrets remain in environment variables. */
export const weddingConfig: WeddingConfig = {
  names: { first: "Shee Salamata", second: "Don Vincent", combined: "Shee Salamata & Don Vincent" },
  monogram: "S & D", date: "2026-12-17", timezone: "Africa/Kigali",
  startTime: "15:00", endTime: null, rsvpDeadline: null,
  venue: {
    name: "Kigali Serena Hotel",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kigali+Serena+Hotel",
    embedUrl: "https://maps.google.com/maps?q=Kigali%20Serena%20Hotel&output=embed",
  },
  story: null,
  photography: { hero: { src: "/images/couple.jpeg", alt: "Shee Salamata and Don Vincent smiling together", width: 1600, height: 1066 }, mobileHero: { src: "/images/couple.jpeg", alt: "Shee Salamata and Don Vincent smiling together", width: 1600, height: 1066 }, couple: photographs.balloons, story: photographs.selfie },
  photos: [photographs.sharedSmile, photographs.selfie, photographs.balloons, { src: "/images/couple.jpeg", alt: "Shee Salamata and Don Vincent together", width: 1600, height: 1066, caption: "With you, always" }],
  countdown: { useDateBeginningWhenTimeUnknown: true },
  programme: [
    { title: "Wedding Ceremony", time: "15:00", location: "Kigali City Hall", description: "Join us at Kigali City Hall as we become husband and wife, surrounded by the people we love." },
    { title: "Wedding Reception", time: "16:30", location: "Kigali Serena Hotel", description: "Celebrate with the newlyweds, family and friends at Kigali Serena Hotel." },
  ],
  music: { src: "/audio/Intashyo - Chacha Imfurikeye ft Fox makare (Official Video) - Chacha Imfurikeye.mp3", title: "Intashyo — Chacha Imfurikeye ft. Fox Makare" },
  whatsappNumber: process.env.NEXT_PUBLIC_HOST_WHATSAPP || "250788408241",
  publicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL || null,
  status: { ceremonyTime: "confirmed", story: "pending", photos: "confirmed" },
};

export function formatEventTime(time: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`1970-01-01T${time}:00Z`));
}
