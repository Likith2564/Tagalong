/**
 * Format an event's date range as a human-readable string.
 * Examples:
 *   "Jul 18 – 19, 2026"  (same month, same year)
 *   "Dec 28 – Jan 2, 2027" (cross-month)
 *   "Jan 17, 2027" (single day)
 */
export function formatEventDateRange(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);

  const sameDay = start === end;
  const sameMonth =
    startDate.getUTCMonth() === endDate.getUTCMonth() &&
    startDate.getUTCFullYear() === endDate.getUTCFullYear();
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();

  const monthShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const day = (d: Date) => d.getUTCDate();
  const year = (d: Date) => d.getUTCFullYear();

  if (sameDay) {
    return `${monthShort(startDate)} ${day(startDate)}, ${year(startDate)}`;
  }

  if (sameMonth) {
    return `${monthShort(startDate)} ${day(startDate)} – ${day(endDate)}, ${year(endDate)}`;
  }

  if (sameYear) {
    return `${monthShort(startDate)} ${day(startDate)} – ${monthShort(endDate)} ${day(endDate)}, ${year(endDate)}`;
  }

  return `${monthShort(startDate)} ${day(startDate)}, ${year(startDate)} – ${monthShort(endDate)} ${day(endDate)}, ${year(endDate)}`;
}
