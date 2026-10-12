/**
 * Compute the next N dispatch dates from now, given active day numbers
 * (0=Sun … 6=Sat). Returns Date objects sorted ascending, starting tomorrow.
 * Lives outside "use server" files because Server Actions must be async.
 */
export function getNextDispatchDates(activeDays: number[], count = 3): Date[] {
  if (activeDays.length === 0) return [];
  const results: Date[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; results.length < count && i < 30; i++) {
    if (activeDays.includes(cursor.getDay())) results.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}
