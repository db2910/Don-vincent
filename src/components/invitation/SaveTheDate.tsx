"use client";

import { useEffect, useRef, useState } from "react";
import { formatEventTime, weddingConfig } from "@/lib/wedding-config";
import { createWeddingCalendar } from "@/lib/calendar";
import styles from "./SaveTheDate.module.css";

export default function SaveTheDate() {
  const [error, setError] = useState("");
  const pendingDownloads = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const downloads = pendingDownloads.current;
    return () => {
      for (const [url, timeout] of downloads) { clearTimeout(timeout); URL.revokeObjectURL(url); }
      downloads.clear();
    };
  }, []);
  function downloadCalendar() {
    try {
      const file = new Blob([createWeddingCalendar(weddingConfig)], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Shee-Salamata-and-Don-Vincent.ics";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // The browser must receive the download before its temporary URL is revoked.
      const timeout = setTimeout(() => { URL.revokeObjectURL(url); pendingDownloads.current.delete(url); }, 1000);
      pendingDownloads.current.set(url, timeout);
      setError("");
    } catch {
      setError("The calendar could not be downloaded. Please add the wedding date to your calendar manually.");
    }
  }
  return (
    <section className={`${styles.section} section`} aria-labelledby="save-date-title">
      <span className={styles.ornament} aria-hidden="true">✧</span>
      <p className="eyebrow">A LITTLE REMINDER</p>
      <h2 id="save-date-title" className={styles.title}>Save the date</h2>
      <p className={styles.description}>Keep a place in your calendar for a day close to our hearts.</p>
      <button type="button" onClick={downloadCalendar} className="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 2v6M17 2v6M3 11h18M8 16h8"/></svg>
        Add to calendar
      </button>
      <p className={styles.calendarNote}>{weddingConfig.startTime ? `Civil marriage at ${formatEventTime(weddingConfig.startTime)} · Reception at 4:00 PM · Kigali time. Both events are included.` : "Saved as an all-day event · Ceremony time to be confirmed"}</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </section>
  );
}
