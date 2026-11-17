"use client";

import { useState } from "react";
import type { RwandaExperienceId } from "@/lib/experiences";
import DiscoverRwanda from "@/components/invitation/DiscoverRwanda";
import RSVPForm from "./RSVPForm";

/** Wedding details first, optional experiences next, then one shared submission. */
export default function GuestResponse({ whatsappNumber, deadline }: { whatsappNumber: string | null; deadline?: string | null }) {
  const [experiences, setExperiences] = useState<RwandaExperienceId[]>([]);
  const [locked, setLocked] = useState(false);
  return <RSVPForm whatsappNumber={whatsappNumber} deadline={deadline} experiences={experiences} onSelectionLockChange={setLocked}>
    <DiscoverRwanda selected={experiences} onSelectionChange={setExperiences} disabled={locked}/>
  </RSVPForm>;
}
