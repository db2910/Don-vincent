import EnvelopeExperience from "@/components/envelope/EnvelopeExperience";
import InvitationNavigation from "@/components/shared/InvitationNavigation";
import SectionReveals from "@/components/shared/SectionReveals";
import MusicToggle from "@/components/shared/MusicToggle";
import WeddingHero from "@/components/invitation/WeddingHero";
import FormalInvitation from "@/components/invitation/FormalInvitation";
import FallingHearts from "@/components/shared/FallingHearts";
import CoupleStory from "@/components/invitation/CoupleStory";
import WeddingItinerary from "@/components/invitation/WeddingItinerary";
import CelebrationDetails from "@/components/invitation/CelebrationDetails";
import VenueDetails from "@/components/invitation/VenueDetails";
import SaveTheDate from "@/components/invitation/SaveTheDate";
import PhotoGallery from "@/components/invitation/PhotoGallery";
import RSVPForm from "@/components/rsvp/RSVPForm";
import ClosingMessage from "@/components/invitation/ClosingMessage";
import { weddingConfig } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";
export default function Home() {
  return <EnvelopeExperience><InvitationNavigation/><main id="main-content"><WeddingHero/><FormalInvitation/><CoupleStory/><CelebrationDetails/><WeddingItinerary/><VenueDetails/><SaveTheDate/><PhotoGallery/><RSVPForm whatsappNumber={weddingConfig.whatsappNumber} deadline={weddingConfig.rsvpDeadline}/></main><ClosingMessage/><FallingHearts/><MusicToggle/><SectionReveals/></EnvelopeExperience>;
}
