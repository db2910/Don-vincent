import { Botanical, Divider, Monogram } from "../shared/Ornaments";
export default function ClosingMessage() {
  return <footer className="closing-section"><Botanical className="closing-botanical left" variant="corner"/><Botanical className="closing-botanical right" variant="corner"/><div data-reveal><Monogram/><p className="eyebrow">17 December 2026</p><Divider/><h2 className="script">We can’t wait to celebrate with you.</h2><p className="closing-love">With love,</p><p className="closing-names script">Shee Salamata & Don Vincent</p></div><div className="footer-rule"><span>A celebration of love & family</span><span>Kigali, Rwanda</span></div></footer>;
}
