"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Pause, Play, X } from "lucide-react";
import { INVITATION_MUSIC_EVENT } from "@/lib/music";
import { loadYouTubeAPI, type YouTubePlayer } from "@/lib/youtube";
import styles from "./MusicToggle.module.css";

export default function YouTubeMusicToggle({ videoId, title }: { videoId: string; title: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<HTMLButtonElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const ready = useRef(false);
  const requested = useRef(false);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const requestPlay = () => {
      requested.current = true;
      setActive(true);
      if (ready.current) player.current?.playVideo();
      else setPending(true);
    };
    window.addEventListener(INVITATION_MUSIC_EVENT, requestPlay);
    return () => window.removeEventListener(INVITATION_MUSIC_EVENT, requestPlay);
  }, []);

  useEffect(() => {
    if (!active || !host.current) return;
    let disposed = false;
    const container = host.current;
    const mount = document.createElement("div");
    container.appendChild(mount);
    // Cover script failures and a player that never becomes ready.
    const timeout = setTimeout(() => {
      if (!disposed && !ready.current) {
        setPending(false);
        setNotice("Music could not load. You can open the song on YouTube below.");
      }
    }, 20_000);
    loadYouTubeAPI().then(api => {
      if (disposed) return;
      player.current = new api.Player(mount, {
        videoId, host: "https://www.youtube-nocookie.com", width: 300, height: 200,
        playerVars: { origin: window.location.origin, playsinline: 1, loop: 1, playlist: videoId, rel: 0 },
        events: {
          onReady: event => {
            if (disposed) return;
            clearTimeout(timeout);
            ready.current = true;
            event.target.getIframe().title = title ?? "Wedding music";
            event.target.getIframe().setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
            setPending(false);
            if (requested.current) event.target.playVideo();
          },
          onStateChange: event => {
            if (disposed) return;
            setPlaying(event.data === 1);
            setPending(event.data === 3);
            if (event.data === 1) setNotice("");
          },
          onError: () => {
            if (disposed) return;
            setPlaying(false); setPending(false);
            setNotice("Music could not play here. Open the song on YouTube below.");
          },
          onAutoplayBlocked: () => {
            if (disposed) return;
            setPlaying(false); setPending(false);
            setNotice("Tap play in the video to start the music.");
          },
        },
      });
    }).catch(() => {
      if (disposed) return;
      setPending(false);
      setNotice("Music could not load. You can open the song on YouTube below.");
    });
    return () => {
      disposed = true;
      clearTimeout(timeout);
      ready.current = false;
      player.current?.destroy();
      player.current = null;
      container.replaceChildren();
    };
  }, [active, title, videoId]);

  function toggle() {
    if (!active) {
      requested.current = true;
      setNotice(""); setPending(true); setActive(true);
    } else if (ready.current) {
      if (playing) player.current?.pauseVideo();
      else player.current?.playVideo();
    }
  }
  function close() {
    requested.current = false;
    player.current?.pauseVideo();
    setActive(false); setPlaying(false); setPending(false); setNotice("");
    control.current?.focus();
  }

  return <div className={`${styles.player} ${styles.youtubePlayer}`}>
    <span className={styles.track} id="wedding-music-track">{title}</span>
    <button ref={control} type="button" className={`${styles.button} ${playing ? styles.playing : ""}`} onClick={toggle} aria-label={pending ? "Loading wedding music" : playing ? "Pause wedding music" : "Play wedding music"} aria-pressed={playing} aria-expanded={active} aria-controls={active ? "wedding-youtube-panel" : undefined} aria-describedby="wedding-music-track" disabled={pending}>
      {pending ? <LoaderCircle className={styles.loading} size={18}/> : playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}
    </button>
    {active && <section className={styles.videoPanel} id="wedding-youtube-panel" aria-label="Wedding music player">
      <div className={styles.videoHeader}><span>Our wedding soundtrack</span><button type="button" onClick={close} aria-label="Close and stop wedding music"><X size={18}/></button></div>
      <div ref={host} className={styles.videoHost}/>
      {notice && <p className={styles.videoNotice} role="status">{notice}</p>}
      <a className={styles.videoLink} href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">Listen on YouTube ↗</a>
    </section>}
  </div>;
}
