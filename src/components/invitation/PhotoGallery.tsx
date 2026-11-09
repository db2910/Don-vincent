"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { weddingConfig } from "@/lib/wedding-config";
import styles from "./PhotoGallery.module.css";

export default function PhotoGallery() {
  const photos = weddingConfig.photos;
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const close = useCallback(() => setActive(null), []);
  const move = useCallback((direction: number) => {
    if (photos.length > 1) setActive((current) => current === null ? null : (current + direction + photos.length) % photos.length);
  }, [photos.length]);
  const isOpen = active !== null;

  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    closeButton.current?.focus();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      opener.current?.focus();
    };
  }, [isOpen]);

  if (!photos.length) return null;
  const current = active !== null ? photos[active] : null;

  return (
    <section id="moments" className={`${styles.section} section`} aria-labelledby="moments-title">
      <div className={styles.heading}>
        <p className="eyebrow">THE BEAUTY OF TOGETHER</p>
        <h2 id="moments-title">Our moments</h2>
        <p>A little glimpse of us, before the next chapter.</p>
      </div>
      <div className={`${styles.collection} ${photos.length === 1 ? styles.single : ""}`}>
        {photos.map((photo, index) => (
          <figure className={styles.figure} key={`${photo.src}-${index}`}>
            <button type="button" className={styles.photoButton} onClick={(event) => { opener.current = event.currentTarget; setActive(index); }} aria-label={`Open photograph ${index + 1}: ${photo.alt}`}>
              <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes={photos.length === 1 ? "(max-width: 768px) 90vw, 900px" : "(max-width: 640px) 90vw, 45vw"} className={styles.photo}/>
              <span className={styles.enlarge} aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.3" fill="none"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/></svg><span>A closer look</span></span>
            </button>
            <figcaption className={styles.caption}><span className="script">{photo.caption || weddingConfig.names.combined}</span><span>{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span></figcaption>
          </figure>
        ))}
      </div>
      {isOpen && current && createPortal(
        <dialog ref={dialog} className={styles.dialog} aria-labelledby="lightbox-caption" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); close(); }
            if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
            if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
            if (event.key === "Tab") {
              const controls = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []);
              const first = controls[0];
              const last = controls[controls.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
              if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
          }}>
          <div className={styles.lightboxContent}>
            <button type="button" ref={closeButton} className={styles.close} aria-label="Close photograph" onClick={close}><span aria-hidden="true">×</span></button>
            <div className={styles.lightboxImage} onTouchStart={(event) => { touchStart.current = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; }} onTouchEnd={(event) => {
              if (!touchStart.current) return;
              const deltaX = event.changedTouches[0].clientX - touchStart.current.x;
              const deltaY = event.changedTouches[0].clientY - touchStart.current.y;
              if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX < 0 ? 1 : -1);
              touchStart.current = null;
            }}>
              <Image src={current.src} alt={current.alt} width={current.width} height={current.height} sizes="95vw" className={styles.fullPhoto}/>
            </div>
            <div className={styles.lightboxFooter}>
              {photos.length > 1 && <button type="button" className={styles.arrow} aria-label="Previous photograph" onClick={() => move(-1)}>←</button>}
              <p id="lightbox-caption" aria-live="polite">{current.alt}{photos.length > 1 && <span> · {active! + 1} of {photos.length}</span>}</p>
              {photos.length > 1 && <button type="button" className={styles.arrow} aria-label="Next photograph" onClick={() => move(1)}>→</button>}
            </div>
          </div>
        </dialog>, document.body,
      )}
    </section>
  );
}
