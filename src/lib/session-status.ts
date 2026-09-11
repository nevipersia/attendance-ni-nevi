export type SessionStatus = "upcoming" | "open" | "closed";

export function getSessionStatus(
  scheduledStart: string,
  scheduledEnd: string,
  graceMinutes: number,
  now: Date = new Date(),
): SessionStatus {
  const graceMs = graceMinutes * 60_000;
  const opensAt = new Date(scheduledStart).getTime() - graceMs;
  const closesAt = new Date(scheduledEnd).getTime() + graceMs;
  const t = now.getTime();

  if (t < opensAt) return "upcoming";
  if (t > closesAt) return "closed";
  return "open";
}
