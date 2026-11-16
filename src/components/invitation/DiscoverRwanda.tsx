import Image from "next/image";
import { ArrowUpRight, MapPin, Clock3 } from "lucide-react";
import { rwandaExperiences } from "@/lib/experiences";
import styles from "./DiscoverRwanda.module.css";

export default function DiscoverRwanda() {
  return <section id="discover-rwanda" className={`section ${styles.section}`} aria-labelledby="discover-rwanda-title">
    <div className={styles.intro} data-reveal>
      <p className="eyebrow">A little more to fall in love with</p>
      <h2 className="script" id="discover-rwanda-title">Discover Rwanda</h2>
      <p className={styles.tagline}>Your journey doesn’t end at the celebration.</p>
      <p>While you’re here to celebrate our special day, we invite you to discover the beauty, culture and unforgettable experiences Rwanda has to offer.</p>
      <p>From extraordinary wildlife encounters to meaningful cultural experiences and thrilling adventures, make the most of your stay in the Land of a Thousand Hills.</p>
    </div>
    <div className={styles.grid}>
      {rwandaExperiences.map((experience, index) => <article className={styles.card} key={experience.id} aria-labelledby={`discover-${experience.id}`} data-reveal>
        <div className={styles.photo}><Image src={experience.image} alt={experience.imageAlt} width={900} height={600} sizes="(max-width: 700px) 86vw, (max-width: 1300px) 42vw, 550px"/><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span></div>
        <div className={styles.copy}>
          <p className={styles.category}>{experience.category}</p>
          <h3 id={`discover-${experience.id}`}>{experience.title}</h3>
          <p className={styles.description}>{experience.description}</p>
          <dl className={styles.details}>
            <div><dt><MapPin size={16} aria-hidden="true"/><span className={styles.srOnly}>Location</span></dt><dd>{experience.location}</dd></div>
            <div><dt><Clock3 size={16} aria-hidden="true"/><span className={styles.srOnly}>Suggested time or availability</span></dt><dd>{experience.duration}</dd></div>
          </dl>
          <a href={experience.href} target="_blank" rel="noopener noreferrer" className={styles.explore} aria-label={`Explore Experience: ${experience.title}`}>Explore Experience <ArrowUpRight size={17} aria-hidden="true"/></a>
        </div>
      </article>)}
    </div>
    <aside className={styles.planning} aria-labelledby="planning-stay-title" data-reveal>
      <span className={styles.ornament} aria-hidden="true">✧</span>
      <h3 id="planning-stay-title">Planning Your Stay?</h3>
      <p>We encourage our guests to explore these wonderful experiences while visiting Rwanda. Some activities require advance reservations, so we recommend planning ahead to make the most of your trip.</p>
      <p>For travel inspiration and additional information, visit Rwanda’s official tourism guide.</p>
      <a href="https://visitrwanda.com/" target="_blank" rel="noopener noreferrer" className={styles.guide}>Explore Rwanda with Visit Rwanda <ArrowUpRight size={20} aria-hidden="true"/></a>
    </aside>
  </section>;
}
