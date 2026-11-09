import { Monogram } from "../shared/Ornaments";
import styles from "./EnvelopeExperience.module.css";

export default function WaxSeal() {
  return <span className={styles.sealPosition} aria-hidden="true"><span className={`${styles.seal} wax-seal`} data-envelope-animated><span className={styles.sealRim}><Monogram /></span></span></span>;
}
