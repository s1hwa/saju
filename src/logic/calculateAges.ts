export function calculateAges(
  startYear: number,
  years: readonly number[],
): number[] {
  return years.map((year) => year - startYear + 1);
}
