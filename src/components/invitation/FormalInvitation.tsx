import { weddingConfig } from "@/lib/wedding-config";
import { Botanical, Divider, Monogram } from "../shared/Ornaments";
export default function FormalInvitation() {
  return <section id="invitation" className="section formal-section" aria-labelledby="formal-title"><div className="section-heading" data-reveal><p className="eyebrow">With love, we invite you</p><h2 id="formal-title">An invitation from our hearts</h2></div>
    <div className="formal-card" data-reveal><div className="formal-frame"><Botanical className="formal-flower top-left" variant="corner"/><Botanical className="formal-flower bottom-right" variant="corner"/>
      <Monogram/><p className="eyebrow formal-overline">Together with our families</p><p className="formal-wording">We joyfully invite you to celebrate<br/>our Gusaba Wedding</p>
      <p className="script formal-names">{weddingConfig.names.first}<span>&</span>{weddingConfig.names.second}</p><Divider/>
      <p className="formal-date">Thursday, 17 December 2026</p><p className="formal-location">{weddingConfig.venue.name}</p><p className="formal-presence">Your presence will make our day even more special.</p>
    </div></div>
  </section>;
}
