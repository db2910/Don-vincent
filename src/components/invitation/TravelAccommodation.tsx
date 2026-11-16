import { ArrowUpRight, BedDouble, Plane } from "lucide-react";
import styles from "./TravelAccommodation.module.css";

export default function TravelAccommodation() {
  return <section id="travel" className={`section ${styles.section}`} aria-labelledby="travel-title">
    <div className="section-heading" data-reveal><p className="eyebrow">A warm welcome to Kigali</p><h2 id="travel-title">Travel &amp; Accommodation</h2><p className={styles.intro}>Settle in, celebrate with us, and leave a little room to explore.</p></div>
    <div className={styles.grid}>
      <article data-reveal><Plane size={28} strokeWidth={1.2} aria-hidden="true"/><h3>Your journey to Kigali</h3><p>Plan your travel to Kigali, Rwanda, and allow time to settle in before the celebration. Find practical information to help prepare your trip.</p><a href="https://visitrwanda.com/practical-information/" target="_blank" rel="noopener noreferrer">Plan your journey <ArrowUpRight size={16} aria-hidden="true"/></a></article>
      <article data-reveal><BedDouble size={28} strokeWidth={1.2} aria-hidden="true"/><h3>Make yourself at home</h3><p>For help planning your stay, share your accommodation preferences when you RSVP. Your preferences help us plan and do not reserve a room.</p><a href="#rsvp">Share your stay preferences <ArrowUpRight size={16} aria-hidden="true"/></a></article>
    </div>
  </section>;
}
