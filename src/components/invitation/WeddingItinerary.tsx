import { Landmark, Wine } from "lucide-react";
import { formatEventTime, weddingConfig } from "@/lib/wedding-config";
import styles from "./WeddingItinerary.module.css";

export default function WeddingItinerary() {
  return <section className={`section ${styles.section}`} id="itinerary" aria-labelledby="itinerary-title">
    <div className={styles.heading} data-reveal>
      <p className="eyebrow">Day programme</p>
      <h2 id="itinerary-title">The Itinerary</h2>
      <span className={styles.rule} aria-hidden="true" />
      <p className={styles.note}>Thursday, 17 December 2026 · All times are in Kigali</p>
    </div>
    <ol className={styles.timeline}>
      {weddingConfig.programme.map((event, index) => {
        const Icon = index === 0 ? Landmark : Wine;
        return <li key={event.time} className={styles.event} data-reveal>
          <div className={styles.details}>
            <time dateTime={event.time}>{formatEventTime(event.time)}</time>
            <h3>{event.title}</h3>
            <p className={styles.location}>{event.location}</p>
            <p className={styles.description}>{event.description}</p>
          </div>
          <span className={styles.marker} aria-hidden="true"><Icon size={30} strokeWidth={1.35} /></span>
        </li>;
      })}
    </ol>
  </section>;
}
