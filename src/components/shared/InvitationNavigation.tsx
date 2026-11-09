"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Monogram } from "./Ornaments";
export default function InvitationNavigation() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><a className="brand" href="#home" aria-label="Shee Salamata and Don Vincent, home"><Monogram/></a>
    <button type="button" className="mobile-menu" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="invitation-navigation" onClick={() => setOpen(!open)}>{open ? <X size={19}/> : <Menu size={19}/>}</button>
    <nav id="invitation-navigation" className={open ? "site-nav is-open" : "site-nav"} aria-label="Invitation navigation" onKeyDown={e => { if (e.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".mobile-menu")?.focus(); } }}>
      {[['#invitation','The invitation'],['#celebration','The celebration'],['#venue','The venue']].map(([href,label]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}</a>)}
      <a className="nav-rsvp" href="#rsvp" onClick={() => setOpen(false)}>Kindly RSVP <span aria-hidden="true">↗</span></a>
    </nav>
  </header>;
}
