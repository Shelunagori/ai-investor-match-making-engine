/** Format a calendar date without constructing a timezone-dependent Date. */
export function formatDate(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Unknown";
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1])
    return "Unknown";
  return `${value.slice(8, 10)}-${value.slice(5, 7)}-${value.slice(0, 4)}`;
}
