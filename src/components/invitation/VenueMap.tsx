"use client";
import { useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { weddingConfig } from "@/lib/wedding-config";
export default function VenueMap() {
  const [loaded, setLoaded] = useState(false);
  return <div className="venue-map"><div className="map-preview">
    {loaded ? <iframe title="Map preview: Kigali Serena Hotel" src={weddingConfig.venue.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/> : <div className="map-invitation"><span className="map-pin-ornament"><MapPin size={28} strokeWidth={1}/></span><p className="eyebrow">Our reception venue</p><p className="map-preview-name">Kigali Serena Hotel</p><button type="button" onClick={() => setLoaded(true)}>Load map preview <ArrowUpRight size={13}/></button><span className="map-provider">Provided by Google Maps</span></div>}
    </div><div className="map-caption"><span>Kigali Serena Hotel</span><a href={weddingConfig.venue.mapUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps <ArrowUpRight size={13}/></a></div><p className="map-fallback">Map unavailable? Get Directions opens the venue search.</p></div>;
}
