import { FLOW_INTERVAL_YEARS, POINT_COUNT } from '../constants/config';
import { FLOW_CYCLE, FLOW_PHASE_OFFSETS, YEAR_OFFSETS } from '../constants/cycleData';
import { SOLAR_TERMS } from '../constants/solarTerms';
import type { ConsultationInput, ConsultationResult, FlowKey } from '../types/consultation';

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function pointIndexForElapsedYears(elapsedYears: number): number {
  const targetYears = Math.abs(elapsedYears);
  let nearestIndex = 0;
  YEAR_OFFSETS.forEach((offset, index) => {
    const nearestDistance = Math.abs(YEAR_OFFSETS[nearestIndex] - targetYears);
    const distance = Math.abs(offset - targetYears);
    if (distance < nearestDistance || (distance === nearestDistance && offset >= targetYears)) {
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

function graphStartAgeFor(springAge: number): number {
  if (springAge <= 0) return 1;
  const residue = mod(springAge, 5);
  if (residue === 0 || residue === 2) return 0;
  if (residue === 4) return -1;
  return 1;
}

export function calculateConsultation(input: ConsultationInput): ConsultationResult {
  const graphStartAge = graphStartAgeFor(input.springAge);
  const springOffset = input.springAge - graphStartAge;
  const exactSpringIndex = YEAR_OFFSETS.indexOf(springOffset as (typeof YEAR_OFFSETS)[number]);
  const fallbackYearsFromAgeOneToSpring = input.springAge - 1;
  const fallbackDirection = fallbackYearsFromAgeOneToSpring === 0
    ? 0
    : -Math.sign(fallbackYearsFromAgeOneToSpring);
  const fallbackStartPointIndex = fallbackDirection * pointIndexForElapsedYears(fallbackYearsFromAgeOneToSpring);
  const startTermIndex = exactSpringIndex >= 0
    ? mod(-exactSpringIndex, SOLAR_TERMS.length)
    : mod(fallbackStartPointIndex, SOLAR_TERMS.length);

  const ages = YEAR_OFFSETS.map((offset) => graphStartAge + offset);
  const years = ages.map((age) => input.springYear + age - 1);
  const displayStartIndex = ages.findIndex((age) => age >= 0);

  if (years.length !== POINT_COUNT || FLOW_CYCLE.length !== 24 || displayStartIndex < 0) {
    throw new Error('흐름 계산 상수가 올바르지 않습니다.');
  }

  const cycleValue = (pointIndex: number, flow: FlowKey) => {
    const cycleIndex = (startTermIndex + pointIndex - FLOW_PHASE_OFFSETS[flow] + FLOW_CYCLE.length)
      % FLOW_CYCLE.length;
    return FLOW_CYCLE[cycleIndex];
  };

  const points = years.map((year, index) => ({
    index,
    solarTerm: SOLAR_TERMS[(startTermIndex + index) % SOLAR_TERMS.length],
    year,
    age: ages[index],
    psychology: cycleValue(index, 'psychology'),
    means: cycleValue(index, 'means'),
    wealth: cycleValue(index, 'wealth'),
    honor: cycleValue(index, 'honor'),
  }));

  return {
    ...input,
    name: input.name.trim(),
    startYear: input.springYear,
    startSolarTerm: points[displayStartIndex].solarTerm,
    graphStartAge,
    displayStartIndex,
    intervalYears: FLOW_INTERVAL_YEARS,
    points,
  };
}
