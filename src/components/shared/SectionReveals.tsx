"use client";
import { useEffect } from "react";
import { INVITATION_REVEALED_EVENT } from "@/lib/music";
export default function SectionReveals() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }, { threshold: .07 });
    document.querySelectorAll("[data-reveal]").forEach(el => { el.classList.add("will-reveal"); observer.observe(el); });
    const revealHero = () => {
      const content = document.querySelector("[data-hero-content]");
      content?.getAnimations?.({ subtree: true }).forEach(animation => {
        if ((animation as CSSAnimation).animationName?.includes("hero-entrance")) { animation.cancel(); animation.play(); }
      });
    };
    window.addEventListener(INVITATION_REVEALED_EVENT, revealHero);
    return () => { observer.disconnect(); window.removeEventListener(INVITATION_REVEALED_EVENT, revealHero); document.querySelectorAll(".will-reveal").forEach(el => el.classList.remove("will-reveal")); };
  }, []);
  return null;
}
