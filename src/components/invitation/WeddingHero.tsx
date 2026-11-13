import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { weddingConfig } from "@/lib/wedding-config";
import WeddingCountdown from "./WeddingCountdown";
import styles from "./WeddingHero.module.css";

export default function WeddingHero() {
  const { hero } = weddingConfig.photography;
  return <section className={styles.hero} id="home" aria-labelledby="couple-names">
    <picture className={styles.photograph}><Image src={hero.src} alt={`${weddingConfig.names.first} and ${weddingConfig.names.second} together.`} fill loading="eager" fetchPriority="high" sizes="100vw" className={styles.image}/></picture>
    <div className={styles.shade}/><div className={styles.frame} aria-hidden="true"/>
    <div className={styles.content} data-hero-content><p className={`eyebrow ${styles.overline}`}>TOGETHER WITH OUR FAMILIES</p><p className={styles.invitation}>We joyfully invite you to celebrate our Wedding</p>
      <h1 className={`${styles.names} script`} id="couple-names" tabIndex={-1}><span>{weddingConfig.names.first}</span><span className={styles.secondName}><span className={styles.amp}>&</span>{weddingConfig.names.second}</span></h1>
      <div className={styles.date}>THURSDAY <span aria-hidden="true">·</span> 17 DECEMBER 2026</div><p className={styles.venue}>Kigali City Hall · 3:00 PM <span aria-hidden="true">·</span> Reception at Kigali Serena Hotel · 4:30 PM</p>
      <WeddingCountdown/><a href="#rsvp" className={`button ${styles.rsvp}`}>Kindly RSVP <ArrowUpRight size={17}/></a><p className={styles.presence}>Your presence will make our day even more special.</p>
    </div>
    <a href="#invitation" className={styles.scroll} aria-label="Explore the invitation"><ArrowDown size={20}/><span>Our invitation</span></a>
  </section>;
}
