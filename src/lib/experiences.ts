/** Activity ideas checked against Visit Rwanda's destination guide.
 * https://visitrwanda.com/three-day-experiences/
 * Selections express interest; the hosts arrange details separately. */
export const rwandaExperiences = [
  {
    id: "lake_kivu", title: "Lake Kivu escape", location: "Lake Kivu", category: "Unwind by the water",
    description: "Boat rides, island views and a little time to slow down by the lake.",
    image: "/images/experiences/lake-kivu.webp",
  },
  {
    id: "akagera_safari", title: "Akagera safari", location: "Akagera National Park", category: "A little adventure",
    description: "Discover Rwanda’s savannah and look out for wildlife on a game drive.",
    image: "/images/experiences/akagera.webp",
  },
  {
    id: "nyungwe_canopy", title: "Nyungwe canopy walk", location: "Nyungwe National Park", category: "Above the treetops",
    description: "Step into the rainforest and take in the views from the canopy walkway.",
    image: "/images/experiences/nyungwe.webp",
  },
  {
    id: "gorilla_trekking", title: "Gorilla trekking", location: "Volcanoes National Park", category: "An extraordinary encounter",
    description: "Explore the forest with a guide for a mountain gorilla encounter.",
    image: "/images/experiences/gorillas.webp",
  },
] as const;

export type RwandaExperienceId = typeof rwandaExperiences[number]["id"];
export const experienceIds = rwandaExperiences.map(experience => experience.id);
export function experienceTitles(ids: readonly RwandaExperienceId[]): string[] {
  return rwandaExperiences.filter(experience => ids.includes(experience.id)).map(experience => experience.title);
}
