export type SessionStatus = "upcoming" | "open" | "closed";
export type CheckinPhase = "upcoming" | "present" | "late" | "closed";

/** Minutes after scheduled_start before a check-in counts as late. */
export const LATE_AFTER_MINUTES = 10;
/** Minutes after scheduled_start after which self check-in closes entirely. */
export const CHECKIN_CLOSES_AFTER_MINUTES = 30;

/**
 * Present before the scheduled start, late from +10min, and closed
 * (no more self check-in) from +30min. `graceMinutes` only controls how
 * early the window opens before the scheduled start.
 */
export function getCheckinPhase(
  scheduledStart: string,
  graceMinutes: number,
  now: Date = new Date(),
): CheckinPhase {
  const start = new Date(scheduledStart).getTime();
  const t = now.getTime();
  const opensAt = start - graceMinutes * 60_000;
  const lateAt = start + LATE_AFTER_MINUTES * 60_000;
  const closesAt = start + CHECKIN_CLOSES_AFTER_MINUTES * 60_000;

  if (t < opensAt) return "upcoming";
  if (t < lateAt) return "present";
  if (t < closesAt) return "late";
  return "closed";
}

/** Collapsed view of getCheckinPhase for admin status pills. */
export function getSessionStatus(
  scheduledStart: string,
  graceMinutes: number,
  now: Date = new Date(),
): SessionStatus {
  const phase = getCheckinPhase(scheduledStart, graceMinutes, now);
  if (phase === "upcoming") return "upcoming";
  if (phase === "closed") return "closed";
  return "open";
}
