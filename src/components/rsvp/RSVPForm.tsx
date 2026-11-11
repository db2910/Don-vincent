"use client";

import { useRef, useState, type FormEvent } from "react";
import { rsvpSchema, type RSVPPayload } from "@/lib/validation/rsvp";
import { isRsvpFailureCode, rsvpFailureMessages } from "@/lib/rsvp-errors";
import { formSubmitPreparationSchema, type FormSubmitVerification } from "@/lib/validation/formsubmit";
import { deliverFormSubmit } from "@/lib/notifications/formsubmit-browser";
import "./rsvp.css";

type FormValues = {
  fullName: string;
  contact: string;
  attendanceStatus: string;
  accommodationStatus: string;
  budgetCurrency: string;
  budgetAmount: string;
  nights: string;
  breakfastPreference: string;
  accommodationType: string;
  sharingPreference: string;
  roomOccupants: string;
  guestMessage: string;
  website: string;
};
type Errors = Record<string, string>;
type SubmitState = "idle" | "validating" | "submitting" | "success" | "error";
type Props = { whatsappNumber: string | null; deadline?: string | null };

const initialValues: FormValues = {
  fullName: "", contact: "", attendanceStatus: "", accommodationStatus: "",
  budgetCurrency: "USD", budgetAmount: "", nights: "", breakfastPreference: "",
  accommodationType: "", sharingPreference: "", roomOccupants: "", guestMessage: "", website: "",
};

const choices = {
  attendanceStatus: [["accepted", "Joyfully accepts"], ["declined", "Regretfully declines"]],
  accommodationStatus: [["yes", "Yes"], ["no", "No, I have my own arrangements"], ["unsure", "I'm not sure yet"]],
  breakfastPreference: [["breakfast", "Bed and breakfast"], ["room_only", "Room only — no breakfast"], ["no_preference", "No preference"]],
  accommodationType: [["hotel", "Hotel"], ["apartment", "Apartment"], ["either", "Either is fine"]],
  sharingPreference: [["private", "I prefer a private room"], ["share", "I'm happy to share if needed"], ["own_group", "I'll share with my own group"]],
} as const;

const humanLabels: Record<string, string> = Object.fromEntries(Object.values(choices).flatMap((group) => group.map(([value, label]) => [value, label])));

/** Clear inapplicable values in the request, while preserving them in the local form. */
function payloadFrom(values: FormValues) {
  const attending = values.attendanceStatus === "accepted";
  const needsStay = attending && values.accommodationStatus === "yes";
  const numeric = (value: string) => value.trim() === "" ? null : Number(value);
  return {
    fullName: values.fullName.trim(),
    contact: values.contact.trim(),
    attendanceStatus: values.attendanceStatus,
    accommodationStatus: attending ? values.accommodationStatus : "not_applicable",
    budgetCurrency: needsStay ? values.budgetCurrency : null,
    budgetAmount: needsStay ? numeric(values.budgetAmount) : null,
    nights: needsStay ? numeric(values.nights) : null,
    breakfastPreference: needsStay ? values.breakfastPreference || null : null,
    accommodationType: needsStay ? values.accommodationType || null : null,
    sharingPreference: needsStay ? values.sharingPreference || null : null,
    roomOccupants: needsStay ? numeric(values.roomOccupants) : null,
    guestMessage: values.guestMessage.trim(),
    website: values.website,
  };
}

function responseLines(payload: RSVPPayload): [string, string][] {
  const lines: [string, string][] = [
    ["Guest", payload.fullName],
    ["Contact", payload.contact],
    ["Attendance", humanLabels[payload.attendanceStatus]],
  ];
  if (payload.attendanceStatus === "accepted") {
    lines.push(["Accommodation", payload.accommodationStatus === "yes" ? "Requested for planning" : humanLabels[payload.accommodationStatus]]);
    if (payload.accommodationStatus === "yes") {
      lines.push(
        ["Budget / room / night", `${payload.budgetCurrency} ${payload.budgetAmount?.toLocaleString("en-US", { maximumSignificantDigits: 21 })}`],
        ["Nights", String(payload.nights)],
        ["Breakfast", humanLabels[payload.breakfastPreference!]],
        ["Stay preference", humanLabels[payload.accommodationType!]],
        ["Room sharing", humanLabels[payload.sharingPreference!]],
        ["People in your room", String(payload.roomOccupants)],
      );
    }
  }
  return lines;
}

function ErrorText({ name, errors }: { name: string; errors: Errors }) {
  return errors[name] ? <p className="rsvp-field-error" id={`rsvp-${name}-error`}>{errors[name]}</p> : null;
}

function ChoiceGroup({ name, label, options, value, onChange, errors }: {
  name: keyof FormValues;
  label: string;
  options: readonly (readonly [string, string])[];
  value: string;
  onChange: (name: keyof FormValues, value: string) => void;
  errors: Errors;
}) {
  return <fieldset className="rsvp-choice-group" id={`rsvp-${name}`} tabIndex={-1} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `rsvp-${name}-error` : undefined}>
    <legend>{label} <span className="rsvp-required">*</span></legend>
    <div className={`rsvp-choices ${options.length === 2 ? "rsvp-choices-pair" : ""}`}>
      {options.map(([option, text]) => <label className={`rsvp-choice ${value === option ? "is-selected" : ""}`} key={option}>
        <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(name, option)} required />
        <span>{text}</span>
      </label>)}
    </div>
    <ErrorText name={name} errors={errors} />
  </fieldset>;
}

function Review({ payload }: { payload: RSVPPayload }) {
  return <dl className="rsvp-review">
    {responseLines(payload).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    {payload.guestMessage && <div className="rsvp-review-message"><dt>Your message</dt><dd>{payload.guestMessage}</dd></div>}
  </dl>;
}

export default function RSVPForm({ whatsappNumber, deadline }: Props) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<SubmitState>("idle");
  const [confirmed, setConfirmed] = useState<RSVPPayload | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [supportCode, setSupportCode] = useState("");
  const [verification, setVerification] = useState<FormSubmitVerification | null>(null);
  const [whatsappOpened, setWhatsappOpened] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const submission = useRef<{ fingerprint: string; key: string } | null>(null);
  const attending = values.attendanceStatus === "accepted";
  const sent = status === "success";
  const busy = status === "submitting" || status === "validating";
  const parsedPayload = rsvpSchema.safeParse(payloadFrom(values));
  const validPayload = parsedPayload.success ? parsedPayload.data : null;
  const whatsappDigits = whatsappNumber?.replace(/[^\d]/g, "") ?? "";
  const whatsappReady = /^\d{7,15}$/.test(whatsappDigits);

  function change(name: keyof FormValues, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      if (name === "attendanceStatus" && value !== "accepted") delete next.accommodationStatus;
      if ((name === "attendanceStatus" && value !== "accepted") || (name === "accommodationStatus" && value !== "yes")) {
        for (const field of ["budgetCurrency", "budgetAmount", "nights", "breakfastPreference", "accommodationType", "sharingPreference", "roomOccupants"]) delete next[field];
      }
      return next;
    });
    setSubmitError("");
    setSupportCode("");
    setVerification(null);
    setWhatsappOpened(false);
    if (status === "error") {
      setStatus("idle");
      setConfirmed(null);
    }
  }

  function showErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
    const nextErrors: Errors = {};
    for (const issue of issues) {
      const field = String(issue.path[0] ?? "form");
      if (!nextErrors[field]) nextErrors[field] = issue.message;
    }
    setErrors(nextErrors);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || sent) return;
    setStatus("validating");
    const result = rsvpSchema.safeParse(payloadFrom(values));
    if (!result.success) {
      setStatus("idle");
      showErrors(result.error.issues);
      return;
    }
    const fingerprint = JSON.stringify(result.data);
    inFlight.current = true;
    setStatus("submitting");
    setSubmitError("");
    setSupportCode("");
    setVerification(null);
    setErrors({});
    try {
      if (submission.current?.fingerprint !== fingerprint) {
        submission.current = { fingerprint, key: crypto.randomUUID() };
      }
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": submission.current.key },
        body: fingerprint,
        signal: AbortSignal.timeout(30_000),
      });
      const responseData: unknown = await response.json();
      const data = responseData as { code?: unknown } | null;
      if (!response.ok) {
        throw new Error(isRsvpFailureCode(data?.code) ? data.code : response.status === 429 ? "rate_limited" : "request_failed");
      }
      const prepared = formSubmitPreparationSchema.safeParse(responseData);
      if (!prepared.success || prepared.data.reference !== submission.current.key) throw new Error("unconfirmed_response");
      const delivery = await deliverFormSubmit(prepared.data.delivery);
      if (!delivery.accepted) {
        if (delivery.supportCode) setSupportCode(delivery.supportCode);
        // Timeouts have uncertain delivery, so only explicit rejection offers
        // a second, CAPTCHA-enabled browser form using the same reference.
        if (delivery.code === "provider_rejected") setVerification(prepared.data.verification);
        throw new Error(delivery.code);
      }
      setConfirmed(result.data);
      setStatus("success");
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setStatus("error");
      setSubmitError(error instanceof Error && isRsvpFailureCode(error.message)
        ? rsvpFailureMessages[error.message]
        : "We couldn’t confirm your RSVP. Your details are still here. Please try again.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      inFlight.current = false;
    }
  }

  const whatsappText = validPayload ? [
    "RSVP for Shee Salamata & Don Vincent’s Civil Wedding — 17 December 2026",
    ...responseLines(validPayload).map(([label, value]) => `${label}: ${value}`),
    ...(validPayload.guestMessage ? [`Message: ${validPayload.guestMessage}`] : []),
    "Accommodation preferences are for planning only, not a booking.",
  ].join("\n") : "";

  return <section id="rsvp" className="section rsvp-section" aria-labelledby="rsvp-title">
    <div className="rsvp-intro">
      <span className="rsvp-small-ornament" aria-hidden="true">✧</span>
      <p className="eyebrow">WE&apos;D LOVE TO HAVE YOU WITH US</p>
      <h2 className="script" id="rsvp-title">Will you join us?</h2>
      <p>Please let us know whether you will attend.</p>
      {deadline && <p className="rsvp-deadline">Kindly reply by {deadline}.</p>}
    </div>
    <div className="rsvp-paper">
      <p className="rsvp-form-introduction">A personal reply, with love. Fields marked <span className="rsvp-required">*</span> are required.</p>
      <noscript><p className="rsvp-note">Please enable JavaScript to reply online. You can still view all the wedding details above.</p></noscript>
      <form method="post" action="/api/rsvp" noValidate onSubmit={handleSubmit} aria-busy={busy} aria-label="Wedding RSVP">
        {(Object.keys(errors).length > 0 || submitError) && <div className="rsvp-error-summary" ref={errorRef} tabIndex={-1} role="alert">
          {submitError || "Please check the highlighted details below."}
          {supportCode && <p className="rsvp-support-code">Support code: {supportCode}</p>}
          {verification && validPayload && <div className="rsvp-verification">
            <p>You can also send your reply with a security check. Your details are already filled in.</p>
            <button className="button" type="submit" form="rsvp-verification">Continue with verification <span aria-hidden="true">↗</span></button>
            <p className="rsvp-field-hint">Opens FormSubmit in a new tab. Complete its security check and wait for confirmation there. Opening the tab alone does not confirm your RSVP.</p>
          </div>}
          {Object.keys(errors).length > 0 && <ul>{Object.entries(errors).map(([name, message]) => <li key={name}><a href={`#rsvp-${name}`} onClick={(event) => { event.preventDefault(); document.getElementById(`rsvp-${name}`)?.focus(); }}>{message}</a></li>)}</ul>}
        </div>}
        <fieldset className="rsvp-form-fields" aria-label="Your RSVP details" disabled={busy || sent}>
          <div className="rsvp-honeypot" aria-hidden="true"><label htmlFor="rsvp-website">Leave this field empty</label><input id="rsvp-website" name="website" autoComplete="off" tabIndex={-1} value={values.website} onChange={(event) => change("website", event.target.value)} /></div>
          <div className="rsvp-field"><label htmlFor="rsvp-fullName">Full name <span className="rsvp-required">*</span></label><input id="rsvp-fullName" name="fullName" autoComplete="name" maxLength={100} value={values.fullName} onChange={(event) => change("fullName", event.target.value)} required aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "rsvp-fullName-error" : undefined} /><ErrorText name="fullName" errors={errors} /></div>
          <div className="rsvp-field"><label htmlFor="rsvp-contact">Phone or email <span className="rsvp-required">*</span></label><input id="rsvp-contact" name="contact" type="text" autoComplete="off" maxLength={160} value={values.contact} onChange={(event) => change("contact", event.target.value)} required aria-invalid={!!errors.contact} aria-describedby={`rsvp-contact-hint${errors.contact ? " rsvp-contact-error" : ""}`} /><p className="rsvp-field-hint" id="rsvp-contact-hint">For a phone number, please include your country code.</p><ErrorText name="contact" errors={errors} /></div>
          <ChoiceGroup name="attendanceStatus" label="Will you attend?" options={choices.attendanceStatus} value={values.attendanceStatus} onChange={change} errors={errors} />
          {attending && <div className="rsvp-accommodation rsvp-reveal">
            <ChoiceGroup name="accommodationStatus" label="Will you need accommodation?" options={choices.accommodationStatus} value={values.accommodationStatus} onChange={change} errors={errors} />
            {values.accommodationStatus === "yes" && <div className="rsvp-stay-details rsvp-reveal">
              <p className="rsvp-note">Share your preferences to help us plan your stay. This is not a booking.</p>
              <div className="rsvp-field"><label htmlFor="rsvp-budgetAmount">Budget per room per night <span className="rsvp-required">*</span></label><div className="rsvp-budget"><div><label className="rsvp-sr-only" htmlFor="rsvp-budgetCurrency">Currency</label><select id="rsvp-budgetCurrency" name="budgetCurrency" value={values.budgetCurrency} onChange={(event) => change("budgetCurrency", event.target.value)} aria-invalid={!!errors.budgetCurrency} aria-describedby={errors.budgetCurrency ? "rsvp-budgetCurrency-error" : undefined}><option value="USD">USD — US dollars</option><option value="RWF">RWF — Rwanda francs</option></select></div><input id="rsvp-budgetAmount" name="budgetAmount" type="number" inputMode="decimal" min="0" step="any" value={values.budgetAmount} onChange={(event) => change("budgetAmount", event.target.value)} required aria-invalid={!!errors.budgetAmount} aria-describedby={`rsvp-budgetAmount-hint${errors.budgetAmount ? " rsvp-budgetAmount-error" : ""}`} /></div><p className="rsvp-field-hint" id="rsvp-budgetAmount-hint">Enter an amount greater than zero in your selected currency.</p><ErrorText name="budgetCurrency" errors={errors} /><ErrorText name="budgetAmount" errors={errors} /></div>
              <div className="rsvp-field"><label htmlFor="rsvp-nights">How many nights will you stay? <span className="rsvp-required">*</span></label><input id="rsvp-nights" name="nights" className="rsvp-short-input" type="number" inputMode="numeric" min="1" step="1" value={values.nights} onChange={(event) => change("nights", event.target.value)} required aria-invalid={!!errors.nights} aria-describedby={errors.nights ? "rsvp-nights-error" : undefined} /><ErrorText name="nights" errors={errors} /></div>
              <ChoiceGroup name="breakfastPreference" label="Would you like breakfast included?" options={choices.breakfastPreference} value={values.breakfastPreference} onChange={change} errors={errors} />
              <ChoiceGroup name="accommodationType" label="Where would you prefer to stay?" options={choices.accommodationType} value={values.accommodationType} onChange={change} errors={errors} />
              <ChoiceGroup name="sharingPreference" label="Room-sharing preference" options={choices.sharingPreference} value={values.sharingPreference} onChange={change} errors={errors} />
              <div className="rsvp-field"><label htmlFor="rsvp-roomOccupants">How many people would stay in your room, including you? <span className="rsvp-required">*</span></label><input id="rsvp-roomOccupants" name="roomOccupants" className="rsvp-short-input" type="number" inputMode="numeric" min="1" step="1" value={values.roomOccupants} onChange={(event) => change("roomOccupants", event.target.value)} required aria-invalid={!!errors.roomOccupants} aria-describedby={errors.roomOccupants ? "rsvp-roomOccupants-error" : undefined} /><ErrorText name="roomOccupants" errors={errors} /></div>
            </div>}
            {values.accommodationStatus === "unsure" && <p className="rsvp-note rsvp-reveal">That’s quite all right. We’ll share your uncertainty with the hosts so they can plan.</p>}
          </div>}
          <div className="rsvp-message rsvp-field"><label htmlFor="rsvp-guestMessage">A message for the couple <span className="rsvp-optional">(optional)</span></label><textarea id="rsvp-guestMessage" name="guestMessage" rows={4} maxLength={1200} value={values.guestMessage} onChange={(event) => change("guestMessage", event.target.value)} aria-invalid={!!errors.guestMessage} aria-describedby={errors.guestMessage ? "rsvp-guestMessage-error" : undefined} /><ErrorText name="guestMessage" errors={errors} /></div>
          <p className="rsvp-privacy">Your contact details and accommodation preferences are shared privately with the wedding hosts to help plan the celebration. Accommodation preferences do not reserve a room.</p>
          <div className="rsvp-actions">
            <button type="submit" className="button rsvp-send" disabled={busy || sent}>{sent ? "RSVP sent" : status === "submitting" ? "Sending your reply…" : status === "validating" ? "Checking your reply…" : status === "error" ? "Try Again" : "Send My RSVP"}<span aria-hidden="true">♡</span></button>
          </div>
        </fieldset>
        {sent && <div className="rsvp-confirmation" ref={resultRef} tabIndex={-1} role="status">
          <span className="rsvp-confirmation-mark" aria-hidden="true">✓</span>
          <div>
            <p className="rsvp-confirmation-heading">Your reply has been submitted</p>
            <p>{confirmed?.attendanceStatus === "declined"
              ? "Thank you for letting us know. We’ll keep you close in our hearts."
              : "Thank you for replying. We can’t wait to celebrate with you in Kigali."}</p>
            {confirmed?.accommodationStatus === "yes" && <p>Your stay preferences are for planning only. No accommodation has been booked.</p>}
          </div>
        </div>}
        {confirmed && sent && <details className="rsvp-response-details"><summary>View your submitted reply</summary><Review payload={confirmed} /></details>}
        {whatsappReady && <div className="rsvp-whatsapp">
          {validPayload ? <a className="rsvp-whatsapp-link" href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer" onClick={() => setWhatsappOpened(true)}>RSVP via WhatsApp <span aria-hidden="true">↗</span></a> : <button className="rsvp-whatsapp-link" type="button" disabled>RSVP via WhatsApp</button>}
          <p>{!validPayload ? "Complete your details to prepare a WhatsApp message." : whatsappOpened ? "Your message has been prepared. Send it in WhatsApp to reach the hosts. Opening WhatsApp does not send this form." : "Prefer a personal message? Send your prepared reply to the hosts. Opening WhatsApp does not send this form."}</p>
        </div>}
      </form>
      {verification && status === "error" && validPayload && <form id="rsvp-verification" action={verification.action} method="post" target="_blank" rel="noopener" aria-label="RSVP with verification">
        {Object.entries(verification.fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      </form>}
    </div>
    <p className="rsvp-signature">With love, Shee Salamata &amp; Don Vincent</p>
  </section>;
}
