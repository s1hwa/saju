import { FLOW_INTERVAL_YEARS, POINT_COUNT } from '../constants/config';
import { FLOW_CYCLE, FLOW_PHASE_OFFSETS, YEAR_OFFSETS } from '../constants/cycleData';
import { SOLAR_TERMS } from '../constants/solarTerms';
import type { ConsultationInput, ConsultationResult, FlowKey } from '../types/consultation';

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function yearOffsetFor(pointIndex: number): number {
  return Math.floor(pointIndex / 2) * 5 + mod(pointIndex, 2) * 2;
}

function graphStartAgeFor(springAge: number): number {
  const residue = mod(springAge, 5);
  if (residue === 0 || residue === 2) return 0;
  if (residue === 4) return -1;
  return 1;
}

export function calculateConsultation(input: ConsultationInput): ConsultationResult {
  let graphStartAge: number;
  let startTermIndex: number;
  let ages: number[];
  if (input.springAge <= 0) {
    // Keep the original ipchun-anchored 2/3-year phase when hiding pre-birth points.
    const elapsedYears = -input.springAge;
    const cycles = Math.floor(elapsedYears / 5);
    const remainder = mod(elapsedYears, 5);
    const firstPointIndex = cycles * 2 + (remainder === 0 ? 0 : remainder <= 2 ? 1 : 2);
    startTermIndex = mod(firstPointIndex, SOLAR_TERMS.length);
    ages = YEAR_OFFSETS.map((_, index) => input.springAge + yearOffsetFor(firstPointIndex + index));
    graphStartAge = ages[0];
  } else {
    graphStartAge = graphStartAgeFor(input.springAge);
    const springOffset = input.springAge - graphStartAge;
    const springIndex = Math.floor(springOffset / 5) * 2 + (mod(springOffset, 5) === 2 ? 1 : 0);
    startTermIndex = mod(-springIndex, SOLAR_TERMS.length);
    ages = YEAR_OFFSETS.map((offset) => graphStartAge + offset);
  }
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
