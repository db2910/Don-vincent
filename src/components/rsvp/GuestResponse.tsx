"use client";

import { useState } from "react";
import type { RwandaExperienceId } from "@/lib/experiences";
import DiscoverRwanda from "@/components/invitation/DiscoverRwanda";
import RSVPForm from "./RSVPForm";

/** Keep travel visually separate while sharing one RSVP submission. */
export default function GuestResponse({ whatsappNumber, deadline }: { whatsappNumber: string | null; deadline?: string | null }) {
  const [experiences, setExperiences] = useState<RwandaExperienceId[]>([]);
  const [locked, setLocked] = useState(false);
  return <>
    <DiscoverRwanda selected={experiences} onSelectionChange={setExperiences} disabled={locked}/>
    <RSVPForm whatsappNumber={whatsappNumber} deadline={deadline} experiences={experiences} onSelectionLockChange={setLocked}/>
  </>;
}
