export const DAY_MS = 24 * 60 * 60 * 1000;

export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

export const toIso = (date: Date | null | undefined): string | null => (date ? date.toISOString() : null);

/** YYYY-MM-DD in India Standard Time, for day-bucketed analytics. */
export function istDateKey(date: Date): string {
  return new Date(date.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);
}
