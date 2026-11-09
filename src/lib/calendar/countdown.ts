import { zonedDateTime } from "./index";

export function getCountdownTarget(date: string, startTime: string | null, timeZone: string, useDateBeginningWhenTimeUnknown = true): number | null {
  if (!startTime && !useDateBeginningWhenTimeUnknown) return null;
  return zonedDateTime(date, startTime || "00:00", timeZone).getTime();
}

export function getCountdownParts(target: number, now: number) {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    complete: target <= now,
  };
}
