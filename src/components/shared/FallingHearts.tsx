import type { CSSProperties } from "react";
import styles from "./FallingHearts.module.css";

const hearts = [
  [3, 11, 24, -6, 12], [8, 8, 29, -22, -9], [14, 6, 32, -13, 9],
  [5, 13, 31, -28, -12], [11, 9, 22, -3, 8], [17, 7, 28, -18, -8],
  [83, 8, 30, -11, 10], [89, 12, 26, -23, -9], [96, 10, 23, -7, 12],
  [86, 6, 34, -30, -7], [92, 9, 28, -16, 10], [98, 7, 32, -2, -8],
] as const;
/** Deterministic edge lanes keep faces and central form fields clear. */
export default function FallingHearts({ variant = "page" }: { variant?: "page" | "envelope" }) {
  return <div className={`${styles.hearts} ${variant === "envelope" ? styles.envelope : ""}`} aria-hidden="true" data-hearts={variant}>
    {hearts.map(([left,size,duration,delay,drift], index) => <span className={styles.heart} key={index} style={{
      "--left": `${left}%`, "--size": `${size}px`, "--duration": `${duration}s`, "--delay": `${delay}s`, "--drift": `${drift}px`, "--opacity": .18 + index % 3 * .07,
    } as CSSProperties}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21S2 14.6 2 7.8A5.3 5.3 0 0 1 12 5a5.3 5.3 0 0 1 10 2.8C22 14.6 12 21 12 21Z"/></svg></span>)}
  </div>;
}
