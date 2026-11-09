import Image from "next/image";
import { weddingConfig } from "@/lib/wedding-config";
import { Botanical, Divider } from "../shared/Ornaments";
export default function CoupleStory() {
  const { couple, story } = weddingConfig.photography;
  return <section className="section couple-section" id="our-story" aria-labelledby="story-title"><div className="couple-layout" data-reveal>
    <div className="couple-media"><figure className="couple-photo-wrap"><Image src={couple.src} alt={couple.alt} width={couple.width} height={couple.height} sizes="(max-width:700px) 80vw, 40vw" className="couple-photo"/><figcaption className="couple-photo-note script">A little glimpse of us</figcaption></figure><div className="story-photo"><Image src={story.src} alt={story.alt} width={story.width} height={story.height} sizes="(max-width:700px) 35vw, 20vw"/></div></div>
    <div className="couple-copy"><p className="eyebrow">Our story</p><h2 id="story-title">A celebration<br/>of us.</h2><Divider/>{weddingConfig.story && <p className="story-text">{weddingConfig.story}</p>}<p className="couple-official">Your presence will make our day even more special.</p><p className="script couple-signature">Shee Salamata<span>&</span>Don Vincent</p><Botanical className="couple-botanical"/></div>
  </div></section>;
}
