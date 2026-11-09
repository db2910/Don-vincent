import { ArrowUpRight, MapPin } from "lucide-react";
import { weddingConfig } from "@/lib/wedding-config";
import VenueMap from "./VenueMap";
export default function VenueDetails() {
  return <section className="section venue-section" id="venue" aria-labelledby="venue-title"><div className="venue-layout" data-reveal><div className="venue-copy"><p className="eyebrow">The wedding reception</p><h2 id="venue-title">A celebration<br/>in <em>Kigali.</em></h2><span className="fine-line"/><p className="venue-name"><MapPin size={19} strokeWidth={1.2}/>{weddingConfig.venue.name}</p><p className="venue-date">Thursday, 17 December 2026 · 4:00 PM</p><a href={weddingConfig.venue.mapUrl} target="_blank" rel="noopener noreferrer" className="button button-outline">Get Directions <ArrowUpRight size={15}/></a></div><VenueMap/></div></section>;
}
