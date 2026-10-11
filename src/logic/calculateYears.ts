import { YEAR_OFFSETS } from '../constants/cycleData';

export function calculateYears(startYear: number): number[] {
  return YEAR_OFFSETS.map((offset) => startYear + offset);
}
