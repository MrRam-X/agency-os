/**
 * Calculates the total business days (inclusive, excluding Saturdays and Sundays)
 * between a start date and an end date.
 */
export function calculateBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const curDate = new Date(start);
  curDate.setHours(0, 0, 0, 0);
  const targetEnd = new Date(end);
  targetEnd.setHours(0, 0, 0, 0);

  while (curDate <= targetEnd) {
    const day = curDate.getDay();
    if (day !== 0 && day !== 6) {
      // 0 = Sunday, 6 = Saturday
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

/**
 * Adds N business days (excluding weekends) to a start date.
 */
export function addBusinessDays(startDate: Date, days: number): Date {
  const date = new Date(startDate);
  date.setHours(0, 0, 0, 0);
  let addedDays = 0;
  while (addedDays < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      addedDays++;
    }
  }
  return date;
}

/**
 * Formats a Date object to YYYY-MM-DD for standard HTML input elements.
 */
export function formatDateToInput(date: Date): string {
  return date.toISOString().split("T")[0];
}
