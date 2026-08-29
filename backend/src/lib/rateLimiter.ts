import { connection } from "./redis";

/**
 * Returns the current hour window key, e.g. "2026-08-29-23"
 */
function getHourWindow(date: Date = new Date()): string {
  return date.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
}

/**
 * Atomically increments the sender's counter for the current hour window,
 * and returns the new count.
 */
export async function incrementSenderHourlyCount(
  senderId: string,
  date: Date = new Date()
): Promise<number> {
  const window = getHourWindow(date);
  const key = `rate:${senderId}:${window}`;

  const count = await connection.incr(key);

  // Ensure the key expires after 2 hours so old counters don't pile up forever
  if (count === 1) {
    await connection.expire(key, 60 * 60 * 2);
  }

  return count;
}

/**
 * Checks whether the sender is currently within their hourly limit,
 * WITHOUT incrementing anything (a read-only check).
 */
export async function getSenderHourlyCount(
  senderId: string,
  date: Date = new Date()
): Promise<number> {
  const window = getHourWindow(date);
  const key = `rate:${senderId}:${window}`;

  const count = await connection.get(key);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Returns milliseconds until the start of the next hour window.
 */
export function msUntilNextHour(date: Date = new Date()): number {
  const next = new Date(date);
  next.setMinutes(60, 0, 0); // rolls over to the top of the next hour
  return next.getTime() - date.getTime();
}