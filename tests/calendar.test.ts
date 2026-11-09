import { describe, expect, it } from "vitest";
import { createWeddingCalendar, escapeCalendarText, foldCalendarLine, zonedDateTime, type CalendarWedding } from "@/lib/calendar";
import { getCountdownParts, getCountdownTarget } from "@/lib/calendar/countdown";
import { weddingConfig } from "@/lib/wedding-config";

const wedding: CalendarWedding = {
  date: "2026-12-17", timezone: "Africa/Kigali", startTime: null, endTime: null,
  names: { combined: "Shee Salamata & Don Vincent" }, venue: { name: "Kigali Serena Hotel" },
};

describe("wedding calendar", () => {
  it("exports civil marriage and reception at their confirmed Kigali times and venues", () => {
    const calendar = createWeddingCalendar(weddingConfig);
    expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(calendar).toContain("DTSTART:20261217T130000Z");
    expect(calendar).toContain("DTSTART:20261217T140000Z");
    expect(calendar).toContain("LOCATION:City Hall");
    expect(calendar).toContain("LOCATION:Kigali Serena Hotel");
    expect(calendar).not.toMatch(/gusaba|DTEND:/i);
  });
  it("exports the confirmed date as an all-day event with an exclusive next-day end", () => {
    const calendar = createWeddingCalendar(wedding, new Date("2026-11-08T12:00:00Z"));
    expect(calendar).toContain("DTSTART;VALUE=DATE:20261217\r\nDTEND;VALUE=DATE:20261218");
    expect(calendar).toContain("LOCATION:Kigali Serena Hotel\r\n");
    expect(calendar).toContain("DTSTAMP:20261108T120000Z");
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(calendar).not.toContain("DTSTART:");
  });
  it("uses a known start time without inventing an end time", () => {
    const timed = createWeddingCalendar({ ...wedding, startTime: "15:00" });
    expect(timed).toContain("DTSTART:20261217T130000Z");
    expect(timed).not.toContain("DTEND:");
    expect(createWeddingCalendar({ ...wedding, endTime: "18:00" })).toContain("DTSTART;VALUE=DATE");
  });
  it("resolves the wedding's Kigali times rather than the guest's timezone", () => {
    const calendar = createWeddingCalendar({ ...wedding, startTime: "14:00", endTime: "18:30" });
    expect(calendar).toContain("DTSTART:20261217T120000Z\r\nDTEND:20261217T163000Z");
    expect(calendar).toContain("X-WR-TIMEZONE:Africa/Kigali");
    expect(calendar).not.toContain("VALUE=DATE");
  });
  it("handles a date-only event crossing a year boundary", () => {
    expect(createWeddingCalendar({ ...wedding, date: "2026-12-31" })).toContain("DTEND;VALUE=DATE:20270101");
  });
  it("escapes special text and prevents extra injected ICS properties", () => {
    expect(escapeCalendarText("A\\B, C;D\nE")).toBe("A\\\\B\\, C\\;D\\nE");
    const calendar = createWeddingCalendar({ ...wedding, venue: { name: "Hotel\r\nATTENDEE:bad@example.com" } });
    expect(calendar).toContain("LOCATION:Hotel\\nATTENDEE:bad@example.com");
    expect(calendar).not.toContain("\r\nATTENDEE:");
  });
  it("folds Unicode without splitting characters and respects 75-octet limits", () => {
    const original = `SUMMARY:${"é🌷".repeat(40)}`;
    const folded = foldCalendarLine(original);
    expect(folded.replace(/\r\n /g, "")).toBe(original);
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded).not.toContain("�");
  });
  it("rejects invalid dates, times and reversed end times", () => {
    expect(() => createWeddingCalendar({ ...wedding, date: "2026-02-30" })).toThrow();
    expect(() => zonedDateTime(wedding.date, "25:00", wedding.timezone)).toThrow();
    expect(() => createWeddingCalendar({ ...wedding, startTime: "18:00", endTime: "14:00" })).toThrow();
  });
});

describe("countdown calculations", () => {
  it("uses the beginning of the wedding date in Kigali without claiming a ceremony time", () => {
    expect(getCountdownTarget(wedding.date, null, wedding.timezone)).toBe(Date.parse("2026-12-16T22:00:00Z"));
    expect(getCountdownTarget(wedding.date, null, wedding.timezone, false)).toBeNull();
  });
  it("calculates a configured Kigali start time", () => {
    const target = getCountdownTarget(wedding.date, "14:00", wedding.timezone)!;
    expect(target).toBe(Date.parse("2026-12-17T12:00:00Z"));
    expect(getCountdownParts(target, target - 90061000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1, complete: false });
  });
  it("clamps every unit at zero after the event", () => {
    expect(getCountdownParts(1000, 2000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, complete: true });
  });
});
