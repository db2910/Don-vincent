"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAnimate, useReducedMotion, type AnimationSequence, type Timeline } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { INVITATION_REVEALED_EVENT, requestInvitationMusic } from "@/lib/music";
import { weddingConfig } from "@/lib/wedding-config";
import FallingHearts from "@/components/shared/FallingHearts";
import { Botanical } from "../shared/Ornaments";
import InvitationCard from "./InvitationCard";
import WaxSeal from "./WaxSeal";
import styles from "./EnvelopeExperience.module.css";

export type EnvelopeState = "idle" | "opening" | "revealing-card" | "card-visible" | "transitioning" | "completed";

// All cues belong to this single timeline. The paper's travel is a percentage of
// its own fixed, responsive size, so resizing never depends on moving bounds.
const CUES = { sealReleased: .38, flapOpen: 1.1, paperVisible: 2.25, transition: 3.35, completed: 4.05 };
const subscribeToHydration = () => () => {};

export default function EnvelopeExperience({ children }: { children?: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [state, setState] = useState<EnvelopeState>("idle");
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const dialog = useRef<HTMLDialogElement>(null);
  const phase = useRef<EnvelopeState>("idle");
  const generation = useRef(0);
  const timeline = useRef<Timeline | null>(null);
  const opening = useRef(false);
  const overflowBeforeOpen = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();

  const updateState = useCallback((next: EnvelopeState) => {
    if (phase.current === next) return;
    phase.current = next;
    setState(next);
  }, []);

  const unlock = useCallback(() => {
    if (overflowBeforeOpen.current === null) return;
    document.body.style.overflow = overflowBeforeOpen.current;
    overflowBeforeOpen.current = null;
  }, []);

  const stopTimeline = useCallback(() => {
    generation.current++;
    const active = timeline.current;
    timeline.current = null;
    active?.stop();
  }, []);

  const complete = useCallback(() => {
    stopTimeline();
    opening.current = false;
    updateState("completed");
    // Every opening starts the invitation at its hero, including footer replays.
    window.history.replaceState(window.history.state, "", "#home");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    dialog.current?.close();
    unlock();
    document.getElementById("couple-names")?.focus({ preventScroll: true });
    window.dispatchEvent(new Event(INVITATION_REVEALED_EVENT));
  }, [stopTimeline, unlock, updateState]);

  const showEnvelope = useCallback(() => {
    const modal = dialog.current;
    if (!modal || phase.current === "completed" || modal.matches(":modal")) return;
    try {
      // SSR paints the fixed envelope immediately. Upgrade it to a native modal
      // synchronously; showModal cannot upgrade an already-open dialog.
      if (modal.open) modal.close();
      modal.showModal();
      overflowBeforeOpen.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      modal.querySelector<HTMLButtonElement>(".envelope-open")?.focus();
    } catch {
      // A browser without dialog support still exposes the complete invitation.
      modal.removeAttribute("open");
      unlock();
    }
  }, [unlock]);

  useEffect(() => {
    showEnvelope();
    const modal = dialog.current;
    return () => {
      stopTimeline();
      modal?.close();
      unlock();
    };
  }, [showEnvelope, stopTimeline, unlock]);

  useEffect(() => {
    if (hydrated && state === "idle" && dialog.current?.open) {
      dialog.current.querySelector<HTMLButtonElement>(".envelope-open")?.focus();
    }
  }, [state, hydrated]);

  async function open() {
    // A synchronous guard also covers two activations in the same React frame.
    if (opening.current || phase.current !== "idle") return;
    opening.current = true;
    // Keep this in the initiating click/key event, before any await or animation.
    requestInvitationMusic();
    updateState("opening");
    if (reducedMotion) { complete(); return; }
    const currentGeneration = ++generation.current;
    const sequence: AnimationSequence = [
      [`.${styles.seal}`, { y: [0, 14], scale: [1, .86], rotate: [0, -16], opacity: [1, 0] }, { duration: CUES.sealReleased, at: 0 }],
      [`.${styles.copy}`, { opacity: [1, 0] }, { duration: .3, at: 0 }],
      [`.${styles.flap}`, { rotateX: [0, -180] }, { duration: CUES.flapOpen - CUES.sealReleased, at: CUES.sealReleased }],
      [`.${styles.card}`, { y: ["0%", "-88%"] }, { duration: CUES.paperVisible - CUES.flapOpen, at: CUES.flapOpen }],
      // This gap is an intentional reading hold within the same tracked timeline.
      [`.${styles.content}`, { opacity: [1, 0], scale: [1, 1.035], y: [0, -12] }, { duration: CUES.completed - CUES.transition, at: CUES.transition }],
    ];
    try {
      const flap = scope.current?.querySelector<HTMLElement>(`.${styles.flap}`);
      const control = animate(sequence, {
        defaultTransition: { ease: [.22, 1, .36, 1] },
        onUpdate: time => {
          if (currentGeneration !== generation.current) return;
          // The folded-back flap must sit BEHIND the emerging paper.
          if (flap && time >= CUES.flapOpen) flap.style.zIndex = "1";
          if (time >= CUES.transition) updateState("transitioning");
          else if (time >= CUES.paperVisible) updateState("card-visible");
          else if (time >= CUES.flapOpen) updateState("revealing-card");
        },
      });
      timeline.current = control;
      await control;
      if (currentGeneration === generation.current) complete();
    } catch {
      if (currentGeneration === generation.current) complete();
    }
  }

  function replay() {
    stopTimeline();
    opening.current = false;
    // Motion's final inline styles are cleared before presenting the fresh paper.
    scope.current?.querySelectorAll<HTMLElement>("[data-envelope-animated]").forEach(element => element.removeAttribute("style"));
    updateState("idle");
    showEnvelope();
  }

  const invitationDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: weddingConfig.timezone }).format(new Date(`${weddingConfig.date}T12:00:00Z`));
  const invitationWeekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: weddingConfig.timezone }).format(new Date(`${weddingConfig.date}T12:00:00Z`));

  return <>
    <noscript><style>{`.envelope-dialog { display: none !important; } body { overflow: auto !important; }`}</style></noscript>
    <dialog open={state !== "completed"} ref={dialog} className={`${styles.dialog} envelope-dialog`} aria-labelledby="envelope-heading" aria-describedby="envelope-instruction" onCancel={event => { event.preventDefault(); complete(); }} data-state={state}>
      <div ref={scope} className={styles.stage}>
        <FallingHearts variant="envelope" />
        <button type="button" className={styles.skip} disabled={!hydrated} onClick={complete}>Skip introduction <ArrowUpRight size={16} aria-hidden="true" /></button>
        <div className={styles.content} data-envelope-animated>
          <p className={`eyebrow ${styles.overline}`}>A celebration of love & family</p>
          <div className={styles.scene}>
            <Botanical className={`${styles.sprig} ${styles.sprigLeft}`} variant="corner" />
            <Botanical className={`${styles.sprig} ${styles.sprigRight}`} variant="corner" />
            <div className={styles.body}>
              <div className={styles.back} aria-hidden="true" />
              <InvitationCard />
              <div className={styles.flap} data-envelope-animated aria-hidden="true" />
              <div className={styles.pocket} aria-hidden="true" />
              <div className={`${styles.fold} ${styles.foldLeft}`} aria-hidden="true" />
              <div className={`${styles.fold} ${styles.foldRight}`} aria-hidden="true" />
              <button className={`${styles.open} envelope-open`} type="button" aria-label="Open your invitation" disabled={!hydrated || state !== "idle"} onClick={open}>
                <WaxSeal />
              </button>
            </div>
          </div>
          <div className={styles.copy} data-envelope-animated>
            <h2 id="envelope-heading" className={`script ${styles.heading}`}>Open Your Invitation</h2>
            <p id="envelope-instruction" className={styles.instruction}>A little envelope. A very special day.</p>
            <p className={styles.date}>{invitationWeekday} · {invitationDate}</p>
          </div>
        </div>
        <span className={styles.status} role="status">{state === "opening" ? "Opening your envelope" : state === "revealing-card" ? "Revealing your invitation" : state === "card-visible" ? `${weddingConfig.names.combined} invite you to celebrate on ${invitationDate}` : ""}</span>
      </div>
    </dialog>
    {children}
    <button className={styles.replay} type="button" onClick={replay}>Open the envelope again <ArrowUpRight size={15} aria-hidden="true" /></button>
  </>;
}
