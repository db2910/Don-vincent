"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Pause, Play } from "lucide-react";
import { weddingConfig } from "@/lib/wedding-config";
import { INVITATION_MUSIC_EVENT } from "@/lib/music";
import styles from "./MusicToggle.module.css";

export default function MusicToggle() {
  const audio = useRef<HTMLAudioElement>(null);
  const starting = useRef(false);
  const attempt = useRef(0);
  const mounted = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const source = weddingConfig.music.src;

  const start = useCallback(async () => {
    const element = audio.current;
    if (!element || starting.current || !element.paused) return;
    starting.current = true;
    const generation = ++attempt.current;
    setPending(true); setError(false);
    try {
      // Called synchronously by the envelope event, before the user gesture ends.
      await element.play();
      if (mounted.current && generation === attempt.current) { setPlaying(!element.paused); setError(false); }
    } catch {
      if (mounted.current && generation === attempt.current) { setPlaying(false); setError(true); }
    } finally {
      if (generation === attempt.current) { starting.current = false; if (mounted.current) setPending(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const element = audio.current;
    if (element && source) element.setAttribute("src", source);
    const requestPlay = () => { void start(); };
    const checkFocus = () => {
      const active = document.activeElement;
      setEditing(active instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName));
    };
    const focusOut = () => queueMicrotask(() => { if (mounted.current) checkFocus(); });
    window.addEventListener(INVITATION_MUSIC_EVENT, requestPlay);
    document.addEventListener("focusin", checkFocus);
    document.addEventListener("focusout", focusOut);
    const activeAttempt = attempt;
    return () => {
      mounted.current = false;
      activeAttempt.current++; starting.current = false;
      window.removeEventListener(INVITATION_MUSIC_EVENT, requestPlay);
      document.removeEventListener("focusin", checkFocus);
      document.removeEventListener("focusout", focusOut);
      if (element) { element.pause(); element.removeAttribute("src"); element.load(); }
    };
  }, [source, start]);

  if (!source) return null;
  function toggle() {
    if (!audio.current || starting.current) return;
    if (playing || !audio.current.paused) audio.current.pause(); else void start();
  }
  return <div className={styles.player} data-editing={editing}>
    <audio ref={audio} src={source} preload="none" loop
      onPlay={() => { setPlaying(true); setError(false); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onError={() => { setPlaying(false); setPending(false); setError(true); starting.current = false; }}/>
    <button type="button" className={`${styles.button} ${playing ? styles.playing : ""}`} onClick={toggle} aria-label={pending ? "Loading wedding music" : playing ? "Pause wedding music" : "Play wedding music"} aria-pressed={playing} disabled={pending} title={weddingConfig.music.title ?? "Wedding music"}>
      {pending ? <LoaderCircle className={styles.loading} size={18}/> : playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}
    </button>
    {error && <p className={styles.error} role="status">Music could not play. Tap to try again.</p>}
  </div>;
}
