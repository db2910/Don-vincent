import { weddingConfig } from "@/lib/wedding-config";
import { Botanical } from "../shared/Ornaments";
import styles from "./EnvelopeExperience.module.css";

export default function InvitationCard() {
  const invitationDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: weddingConfig.timezone }).format(new Date(`${weddingConfig.date}T12:00:00Z`));
  return <div className={`${styles.card} envelope-card`} data-envelope-animated aria-hidden="true">
    <div className={styles.cardFrame}>
      <Botanical className={styles.cardBotanical} />
      <p className={styles.cardOverline}>Together with our families</p>
      <p className={`script ${styles.cardName}`}>{weddingConfig.names.first}</p>
      <span className={`script ${styles.cardAmp}`}>&</span>
      <p className={`script ${styles.cardName}`}>{weddingConfig.names.second}</p>
      <span className={styles.cardRule} />
      <p className={styles.cardDate}>{invitationDate}</p>
    </div>
  </div>;
}
