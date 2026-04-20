import { format, addDays, differenceInCalendarDays } from "date-fns";

/** Bi-weekly pay period anchor: Monday, April 13, 2026 (midnight local) */
const PAY_PERIOD_ANCHOR = new Date(2026, 3, 13);
const PERIOD_LENGTH = 14;

export interface AnchorAlignedPeriod {
  start: Date;
  end: Date;
  label: string;
  periodNumber: number;
  startStr: string;
  endStr: string;
}

/**
 * Compute a bi-weekly pay period by offset from the current period.
 * offset 0 = current period, -1 = previous, +1 = next.
 *
 * Pure arithmetic from the anchor date — no startOfWeek or locale functions.
 */
export function getAnchorAlignedPeriod(offsetFromCurrent: number): AnchorAlignedPeriod {
  const now = new Date();
  // Strip time from "now" to get a clean day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const daysElapsed = differenceInCalendarDays(today, PAY_PERIOD_ANCHOR);
  const currentIndex = daysElapsed >= 0 ? Math.floor(daysElapsed / PERIOD_LENGTH) : 0;
  const targetIndex = currentIndex + offsetFromCurrent;

  const start = addDays(PAY_PERIOD_ANCHOR, targetIndex * PERIOD_LENGTH);
  const end = addDays(start, 13); // inclusive 14-day window (Mon–Sun)

  const periodNumber = targetIndex + 1; // 1-indexed
  const label = `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  return { start, end, label, periodNumber, startStr, endStr };
}