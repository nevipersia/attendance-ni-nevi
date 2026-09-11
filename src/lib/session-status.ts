export type SessionStatus = "upcoming" | "open" | "closed";
export type CheckinPhase = "upcoming" | "present" | "late" | "absent" | "closed";

/** Minutes after scheduled_start before a check-in counts as late. */
export const LATE_AFTER_MINUTES = 10;
/** Minutes after scheduled_start before a check-in auto-marks absent. */
export const ABSENT_AFTER_MINUTES = 30;

/**
 * The QR stays valid for the whole session (until scheduled_end).
 * Present before the scheduled start, late from +10min, auto-marked
 * absent from +30min -- still recorded (method: qr), just as absent
 * instead of being turned away. `graceMinutes` only controls how early
 * the window opens before the scheduled start.
 */
export function getCheckinPhase(
  scheduledStart: string,
  scheduledEnd: string,
  graceMinutes: number,
  now: Date = new Date(),
): CheckinPhase {
  const start = new Date(scheduledStart).getTime();
  const end = new Date(scheduledEnd).getTime();
  const t = now.getTime();
  const opensAt = start - graceMinutes * 60_000;
  const lateAt = start + LATE_AFTER_MINUTES * 60_000;
  const absentAt = start + ABSENT_AFTER_MINUTES * 60_000;

  if (t < opensAt) return "upcoming";
  if (t >= end) return "closed";
  if (t < lateAt) return "present";
  if (t < absentAt) return "late";
  return "absent";
}

/** Collapsed view of getCheckinPhase for admin status pills. */
export function getSessionStatus(
  scheduledStart: string,
  scheduledEnd: string,
  graceMinutes: number,
  now: Date = new Date(),
): SessionStatus {
  const phase = getCheckinPhase(scheduledStart, scheduledEnd, graceMinutes, now);
  if (phase === "upcoming") return "upcoming";
  if (phase === "closed") return "closed";
  return "open";
}
