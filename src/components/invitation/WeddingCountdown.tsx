"use client";
import { useEffect, useState } from "react";
import { formatEventTime, weddingConfig } from "@/lib/wedding-config";
import { getCountdownParts, getCountdownTarget } from "@/lib/calendar/countdown";
import styles from "./WeddingCountdown.module.css";

export default function WeddingCountdown() {
  const target = getCountdownTarget(weddingConfig.date, weddingConfig.startTime, weddingConfig.timezone, weddingConfig.countdown.useDateBeginningWhenTimeUnknown);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (target === null) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const update = () => { const current = Date.now(); setNow(current); if (current >= target && interval) clearInterval(interval); };
    update();
    if (Date.now() < target) interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [target]);
  const parts = target !== null && now !== null ? getCountdownParts(target, now) : null;
  return <div className={styles.countdown} aria-labelledby="countdown-title">
    <p className={`eyebrow ${styles.heading}`} id="countdown-title">UNTIL WE CELEBRATE</p>
    {target === null ? <p className={styles.note}>Thursday, 17 December 2026</p> : <div className={styles.counters} role="timer" aria-label="Time until our wedding date" aria-live="off">
      {(["days", "hours", "minutes", "seconds"] as const).map(unit => <div className={styles.counter} key={unit}><span>{parts ? String(parts[unit]).padStart(2,"0") : "—"}</span><span>{unit}</span></div>)}
    </div>}
    <p className={styles.note}>{parts?.complete ? "Our wedding day has arrived. With love and gratitude." : !weddingConfig.startTime ? "Date countdown · Ceremony time unconfirmed" : `${formatEventTime(weddingConfig.startTime)} · Kigali time`}</p>
  </div>;
}
