import Image from "next/image";
import { rwandaExperiences, type RwandaExperienceId } from "@/lib/experiences";

export default function ExperienceChoices({ selected, onChange, error }: {
  selected: RwandaExperienceId[];
  onChange: (selected: RwandaExperienceId[]) => void;
  error?: string;
}) {
  return <fieldset className="rsvp-experiences" id="rsvp-experiences" tabIndex={-1} aria-invalid={!!error} aria-describedby={`rsvp-experiences-hint${error ? " rsvp-experiences-error" : ""}`}>
    <legend>Make a little more of Rwanda <span className="rsvp-optional">(optional)</span></legend>
    <p className="rsvp-experiences-intro" id="rsvp-experiences-hint">Stay a little longer, make a few memories. Choose any experiences you’d love to explore — you can select more than one.</p>
    <div className="rsvp-experience-grid">
      {rwandaExperiences.map(experience => <label className={`rsvp-experience-card${selected.includes(experience.id) ? " is-selected" : ""}`} key={experience.id}>
        <div className="rsvp-experience-photo">
          <Image src={experience.image} alt="" width={640} height={400} sizes="(max-width: 600px) calc(100vw - 84px), 310px" />
          <span className="rsvp-experience-category">{experience.category}</span>
        </div>
        <div className="rsvp-experience-copy">
          <span className="rsvp-experience-location">{experience.location}</span>
          <span className="rsvp-experience-title" id={`experience-${experience.id}-title`}>{experience.title}</span>
          <span className="rsvp-experience-description" id={`experience-${experience.id}-description`}>{experience.description}</span>
          <span className="rsvp-experience-select">
            <input type="checkbox" name="experiences" value={experience.id} aria-labelledby={`experience-${experience.id}-title`} aria-describedby={`experience-${experience.id}-description`} checked={selected.includes(experience.id)} onChange={event => onChange(event.target.checked ? [...selected, experience.id] : selected.filter(id => id !== experience.id))} />
            <span>{selected.includes(experience.id) ? "Added to your interests" : "I’d love to explore this"}</span>
          </span>
        </div>
      </label>)}
    </div>
    <p className="rsvp-field-hint">Your choices help the hosts plan. Trip details, availability and costs will be shared separately.</p>
    <a className="rsvp-experience-guide" href="https://visitrwanda.com/three-day-experiences/" target="_blank" rel="noopener noreferrer">Explore Rwanda with Visit Rwanda <span aria-hidden="true">↗</span></a>
    {error && <p className="rsvp-field-error" id="rsvp-experiences-error">{error}</p>}
  </fieldset>;
}
