/** Curated travel information, independent of the wedding RSVP.
 * Official destination links checked 16 November 2026. */
export const rwandaExperiences = [
  {
    id: "gorilla-trekking", category: "Iconic wildlife",
    title: "Gorilla Trekking in Volcanoes National Park",
    description: "Journey through Rwanda’s mountain forests for an unforgettable encounter with mountain gorillas in their natural habitat.",
    location: "Musanze, Northern Rwanda", duration: "Full day or overnight trip",
    image: "/images/experiences/gorillas.webp", imageAlt: "Mountain gorillas among the green forests of Volcanoes National Park.",
    href: "https://visitrwandabookings.rdb.rw/rdbportal/mountain-gorilla-tracking",
  },
  {
    id: "akagera-safari", category: "Safari experience",
    title: "Discover the Big Five in Akagera National Park",
    description: "Explore the savannah on safari, with the chance to spot lions, leopards, elephants, buffaloes and rhinos.",
    location: "Eastern Rwanda", duration: "Full day or overnight safari",
    image: "/images/experiences/akagera-lion.webp", imageAlt: "A lioness perched in a tree in Akagera National Park, Rwanda. Photograph by Matthew Poole.",
    href: "https://visitrwanda.com/destinations/akagera-national-park-2/",
  },
  {
    id: "kigali-memorial", category: "History & remembrance",
    title: "Visit the Kigali Genocide Memorial",
    description: "Honour the victims of the 1994 Genocide against the Tutsi and reflect on Rwanda’s history, resilience and reconciliation.",
    location: "Gisozi, Kigali", duration: "Suggested visit: 1.5–2 hours",
    image: "/images/experiences/kigali-memorial-building.webp", imageAlt: "The main building and entrance courtyard at the Kigali Genocide Memorial in Gisozi, Kigali.",
    href: "https://kgm.rw/visit/",
  },
  {
    id: "outdoor-adventure", category: "Outdoor adventure",
    title: "Adventure & Outdoor Experiences",
    description: "Try quad biking, ziplining, horse riding or archery, and discover an adventurous side of your stay in Rwanda.",
    location: "Kigali and surrounding areas", duration: "Availability and locations vary by activity",
    image: "/images/experiences/kigali-adventure.webp", imageAlt: "A zipline adventure in the hills around Kigali.",
    href: "https://visitrwanda.com/tourism/interests/sports-adventure/",
  },
] as const;

export type RwandaExperienceId = typeof rwandaExperiences[number]["id"];
export const experienceIds = rwandaExperiences.map(experience => experience.id);
export function experienceTitles(ids: readonly RwandaExperienceId[]): string[] {
  return rwandaExperiences.filter(experience => ids.includes(experience.id)).map(experience => experience.title);
}
