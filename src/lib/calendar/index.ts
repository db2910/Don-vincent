export interface CalendarWedding {
  date: string;
  timezone: string;
  startTime: string | null;
  endTime: string | null;
  names: { combined: string };
  venue: { name: string };
}

function dateParts(date: string): [number, number, number] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid wedding date");
  const parts = date.split("-").map(Number) as [number, number, number];
  const value = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (value.toISOString().slice(0, 10) !== date) throw new Error("Invalid wedding date");
  return parts;
}

/** Resolve a local ceremony time in its configured IANA zone, never the guest's zone. */
export function zonedDateTime(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = dateParts(date);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Invalid wedding time");
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  let instant = desired;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]));
    const displayed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    const correction = desired - displayed;
    if (correction === 0) return new Date(instant);
    instant += correction;
  }
  throw new Error("This local time is unavailable in the configured timezone");
}

export function escapeCalendarText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** RFC 5545 folds at 75 UTF-8 octets, including the continuation space. */
export function foldCalendarLine(value: string): string {
  const lines: string[] = [];
  let line = "";
  let bytes = 0;
  const encoder = new TextEncoder();
  for (const character of value) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) {
      lines.push(line);
      line = " ";
      bytes = 1;
    }
    line += character;
    bytes += length;
  }
  lines.push(line);
  return lines.join("\r\n");
}

function utcCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function createWeddingCalendar(config: CalendarWedding, now = new Date()): string {
  dateParts(config.date);
  const eventDates: string[] = [];
  if (config.startTime && config.endTime) {
    const start = zonedDateTime(config.date, config.startTime, config.timezone);
    const end = zonedDateTime(config.date, config.endTime, config.timezone);
    if (end <= start) throw new Error("Wedding end time must be after the start time");
    // UTC event instants are universally supported and preserve the configured local times.
    eventDates.push(`DTSTART:${utcCalendarDate(start)}`, `DTEND:${utcCalendarDate(end)}`);
  } else {
    const nextDay = new Date(`${config.date}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    eventDates.push(`DTSTART;VALUE=DATE:${config.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${nextDay.toISOString().slice(0, 10).replace(/-/g, "")}`);
  }
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shee Salamata and Don Vincent//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-TIMEZONE:${escapeCalendarText(config.timezone)}`,
    "BEGIN:VEVENT", `UID:gusaba-${config.date}@shee-salamata-don-vincent.invitation`,
    `DTSTAMP:${utcCalendarDate(now)}`, ...eventDates,
    `SUMMARY:${escapeCalendarText(`${config.names.combined} — Gusaba Wedding`)}`,
    `LOCATION:${escapeCalendarText(config.venue.name)}`,
    `DESCRIPTION:${escapeCalendarText("Together with our families, we joyfully invite you to celebrate our Gusaba Wedding.")}`,
    "STATUS:CONFIRMED", "TRANSP:TRANSPARENT", "END:VEVENT", "END:VCALENDAR",
  ].map(foldCalendarLine).join("\r\n") + "\r\n";
}
