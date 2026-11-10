import { weddingConfig } from "@/lib/wedding-config";
import { Botanical, Divider } from "../shared/Ornaments";
export default function CelebrationDetails() {
  return <section className="section celebration-section" id="celebration" aria-labelledby="celebration-title"><Botanical className="celebration-branch left"/><Botanical className="celebration-branch right"/><div className="celebration-content" data-reveal><p className="eyebrow">Our Civil Wedding</p><h2 id="celebration-title">A day to remember</h2><div className="ceremonial-date"><span className="date-day">Thursday</span><span className="date-number">17</span><span className="date-month">December<br/><span>2026</span></span></div><Divider/><p className="celebrate-line">Celebrate with us</p><h3>Kigali City Hall · 3:00 PM</h3><p>Reception at {weddingConfig.venue.name} · 4:00 PM</p><p className="eyebrow celebration-city">Kigali, Rwanda</p></div></section>;
}
