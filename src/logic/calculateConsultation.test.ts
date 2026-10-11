import { describe, expect, it } from 'vitest';
import { FLOW_CYCLE, YEAR_OFFSETS } from '../constants/cycleData';
import { SOLAR_TERMS } from '../constants/solarTerms';
import { calculateConsultation } from './calculateConsultation';

const EXPECTED_1975_YEARS = [
  1975, 1978, 1980, 1983, 1985, 1988, 1990, 1993, 1995, 1998, 2000, 2003,
  2005, 2008, 2010, 2013, 2015, 2018, 2020, 2023, 2025, 2028, 2030, 2033,
  2035, 2038, 2040, 2043, 2045, 2048, 2050, 2053, 2055, 2058, 2060, 2063,
  2065, 2068, 2070, 2073, 2075,
];

const EXPECTED_AGES_FROM_ONE = [
  1, 4, 6, 9, 11, 14, 16, 19, 21, 24, 26, 29, 31, 34, 36, 39, 41, 44,
  46, 49, 51, 54, 56, 59, 61, 64, 66, 69, 71, 74, 76, 79, 81, 84, 86, 89,
  91, 94, 96, 99, 101,
];

describe('calculateConsultation', () => {
  it.each([
    { springAge: -1, firstIndex: 1, visibleAges: [1, 4, 6, 9, 11] },
    { springAge: -2, firstIndex: 1, visibleAges: [0, 3, 5, 8, 10] },
    { springAge: -3, firstIndex: 2, visibleAges: [2, 4, 7, 9, 12] },
    { springAge: -4, firstIndex: 2, visibleAges: [1, 3, 6, 8, 11] },
    { springAge: -5, firstIndex: 2, visibleAges: [0, 2, 5, 7, 10] },
    { springAge: -16, firstIndex: 7, visibleAges: [1, 4, 6, 9, 11] },
    { springAge: -103, firstIndex: 42, visibleAges: [2, 4, 7, 9, 12] },
    { springAge: 0, firstIndex: 0, visibleAges: [0, 2, 5, 7, 10] },
  ])('preserves Excel timing and values for spring age $springAge', ({ springAge, firstIndex, visibleAges }) => {
    const result = calculateConsultation({ name: 'excel-phase', springYear: 2003, springAge });
    expect(result.points.slice(0, 5).map((point) => point.age)).toEqual(visibleAges);
    result.points.forEach((point, index) => {
      const originalIndex = firstIndex + index;
      const originalOffset = Math.floor(originalIndex / 2) * 5 + (originalIndex % 2 === 1 ? 2 : 0);
      expect(point.age).toBe(springAge + originalOffset);
      expect(point.year).toBe(2003 + point.age - 1);
      expect(point.solarTerm).toBe(SOLAR_TERMS[originalIndex % 24]);
      expect(point.psychology).toBe(FLOW_CYCLE[originalIndex % 24]);
      expect(point.means).toBe(FLOW_CYCLE[((originalIndex - 4) % 24 + 24) % 24]);
      expect(point.wealth).toBe(FLOW_CYCLE[((originalIndex - 8) % 24 + 24) % 24]);
      expect(point.honor).toBe(FLOW_CYCLE[((originalIndex - 12) % 24 + 24) % 24]);
    });
  });

  it('keeps the birth year as age one when spring age is before age one', () => {
    const result = calculateConsultation({
      name: 'sample',
      springYear: 1975,
      springAge: -16,
    });

    expect(result.startYear).toBe(1975);
    expect(result.graphStartAge).toBe(1);
    expect(result.displayStartIndex).toBe(0);
    expect(result.startSolarTerm).toBe(SOLAR_TERMS[7]);
    expect(result.points.map((point) => point.year)).toEqual(EXPECTED_1975_YEARS);
    expect(result.points.map((point) => point.age)).toEqual(EXPECTED_AGES_FROM_ONE);
    expect(result.points[0]).toMatchObject({
      year: 1975,
      age: 1,
      solarTerm: SOLAR_TERMS[7],
    });
  });

  it('does not shift a 2003 birth year to 2020 when spring age is -16', () => {
    const result = calculateConsultation({ name: 'year-check', springYear: 2003, springAge: -16 });

    expect(result.startYear).toBe(2003);
    expect(result.points[0]).toMatchObject({ year: 2003, age: 1, solarTerm: SOLAR_TERMS[7] });
  });

  it('shows zero age when spring age lands on the 0,2,5,7 pattern', () => {
    const result = calculateConsultation({ name: 'seven', springYear: 1980, springAge: 7 });

    expect(result.graphStartAge).toBe(0);
    expect(result.displayStartIndex).toBe(0);
    expect(result.points[0]).toMatchObject({ year: 1979, age: 0, solarTerm: SOLAR_TERMS[21] });
    expect(result.points[3]).toMatchObject({ year: 1986, age: 7, solarTerm: SOLAR_TERMS[0] });
  });

  it('uses a minus-one internal start for 4, 9, 14 style spring ages and hides it from display', () => {
    const result = calculateConsultation({ name: 'nine', springYear: 1980, springAge: 9 });

    expect(result.graphStartAge).toBe(-1);
    expect(result.displayStartIndex).toBe(1);
    expect(result.points[0]).toMatchObject({ year: 1978, age: -1, solarTerm: SOLAR_TERMS[20] });
    expect(result.points[1]).toMatchObject({ year: 1980, age: 1, solarTerm: SOLAR_TERMS[21] });
    expect(result.points[2]).toMatchObject({ year: 1983, age: 4, solarTerm: SOLAR_TERMS[22] });
    expect(result.points[4]).toMatchObject({ year: 1988, age: 9, solarTerm: SOLAR_TERMS[0] });
  });

  it.each([
    { springAge: 1, graphStartAge: 1, displayStartIndex: 0, displayAge: 1, ipchunIndex: 0 },
    { springAge: 2, graphStartAge: 0, displayStartIndex: 0, displayAge: 0, ipchunIndex: 1 },
    { springAge: 3, graphStartAge: 1, displayStartIndex: 0, displayAge: 1, ipchunIndex: 1 },
    { springAge: 4, graphStartAge: -1, displayStartIndex: 1, displayAge: 1, ipchunIndex: 2 },
    { springAge: 5, graphStartAge: 0, displayStartIndex: 0, displayAge: 0, ipchunIndex: 2 },
    { springAge: 6, graphStartAge: 1, displayStartIndex: 0, displayAge: 1, ipchunIndex: 2 },
    { springAge: 7, graphStartAge: 0, displayStartIndex: 0, displayAge: 0, ipchunIndex: 3 },
    { springAge: 8, graphStartAge: 1, displayStartIndex: 0, displayAge: 1, ipchunIndex: 3 },
    { springAge: 9, graphStartAge: -1, displayStartIndex: 1, displayAge: 1, ipchunIndex: 4 },
    { springAge: 10, graphStartAge: 0, displayStartIndex: 0, displayAge: 0, ipchunIndex: 4 },
    { springAge: 11, graphStartAge: 1, displayStartIndex: 0, displayAge: 1, ipchunIndex: 4 },
    { springAge: 12, graphStartAge: 0, displayStartIndex: 0, displayAge: 0, ipchunIndex: 5 },
    { springAge: 13, graphStartAge: 1, displayStartIndex: 0, displayAge: 1, ipchunIndex: 5 },
    { springAge: 14, graphStartAge: -1, displayStartIndex: 1, displayAge: 1, ipchunIndex: 6 },
    { springAge: 15, graphStartAge: 0, displayStartIndex: 0, displayAge: 0, ipchunIndex: 6 },
  ])(
    'places spring age $springAge on ipchun while choosing the correct visible start',
    ({ springAge, graphStartAge, displayStartIndex, displayAge, ipchunIndex }) => {
      const result = calculateConsultation({ name: 'matrix', springYear: 1980, springAge });

      expect(result.graphStartAge).toBe(graphStartAge);
      expect(result.displayStartIndex).toBe(displayStartIndex);
      expect(result.points[displayStartIndex].age).toBe(displayAge);
      expect(result.points[ipchunIndex]).toMatchObject({
        age: springAge,
        year: 1980 + springAge - 1,
        solarTerm: SOLAR_TERMS[0],
      });
      expect(result.points.slice(displayStartIndex).every((point) => point.age >= 0)).toBe(true);
    },
  );

  it.each([
    { springAge: 7, visibleAges: [0, 2, 5, 7, 10] },
    { springAge: 9, visibleAges: [1, 4, 6, 9, 11] },
    { springAge: 11, visibleAges: [1, 3, 6, 8, 11] },
  ])('keeps the first visible ages uncluttered for spring age $springAge', ({ springAge, visibleAges }) => {
    const result = calculateConsultation({ name: 'visible', springYear: 1980, springAge });

    expect(result.points.slice(result.displayStartIndex, result.displayStartIndex + 5).map((point) => point.age))
      .toEqual(visibleAges);
  });

  it('uses exactly 41 points from the 24-term cycle', () => {
    const result = calculateConsultation({ name: 'test', springYear: 1975, springAge: 1 });

    expect(SOLAR_TERMS).toHaveLength(24);
    expect(FLOW_CYCLE).toHaveLength(24);
    expect(YEAR_OFFSETS).toHaveLength(41);
    expect(result.points).toHaveLength(41);
    expect(result.points[40].age).toBe(101);
  });

  it('starts at ipchun when the spring age is already one', () => {
    const result = calculateConsultation({ name: 'test', springYear: 1975, springAge: 1 });

    expect(result.startYear).toBe(1975);
    expect(result.graphStartAge).toBe(1);
    expect(result.displayStartIndex).toBe(0);
    expect(result.startSolarTerm).toBe(SOLAR_TERMS[0]);
    expect(result.points[0]).toMatchObject({
      year: 1975,
      age: 1,
      solarTerm: SOLAR_TERMS[0],
      psychology: -10,
    });
    expect(result.points[24]).toMatchObject({
      year: 2035,
      age: 61,
      solarTerm: SOLAR_TERMS[0],
      psychology: -10,
    });
  });

  it('keeps the four flows ten years apart while filling their earlier cycle values', () => {
    const result = calculateConsultation({ name: 'test', springYear: 1975, springAge: 1 });

    expect(result.points[0]).toMatchObject({ psychology: -10, means: 0, wealth: 10, honor: 20 });
    expect(result.points[4].means).toBe(-10);
    expect(result.points[8].wealth).toBe(-10);
    expect(result.points[12].honor).toBe(-10);
    expect(result.points.every((point) => (
      point.psychology !== null
      && point.means !== null
      && point.wealth !== null
      && point.honor !== null
    ))).toBe(true);
  });

  it.each([
    { springYear: 1900, springAge: -16 },
    { springYear: 1975, springAge: 1 },
    { springYear: 1980, springAge: 7 },
    { springYear: 1980, springAge: 9 },
    { springYear: 2024, springAge: -16 },
    { springYear: 2099, springAge: 14 },
  ])('keeps year and age aligned for birth year $springYear and spring age $springAge', ({ springYear, springAge }) => {
    const result = calculateConsultation({ name: 'year-check', springYear, springAge });

    result.points.forEach((point, index) => {
      expect(point.index).toBe(index);
      expect(point.year).toBe(result.startYear + point.age - 1);
    });
  });

  it('repeats terms and all four flow values after one 24-point cycle', () => {
    const result = calculateConsultation({ name: 'cycle-check', springYear: 2024, springAge: -16 });

    for (let index = 0; index < result.points.length - 24; index += 1) {
      const first = result.points[index];
      const repeated = result.points[index + 24];
      expect(repeated.solarTerm).toBe(first.solarTerm);
      expect(repeated.psychology).toBe(first.psychology);
      expect(repeated.means).toBe(first.means);
      expect(repeated.wealth).toBe(first.wealth);
      expect(repeated.honor).toBe(first.honor);
    }
  });

  it('keeps each flow four points behind the preceding flow', () => {
    const result = calculateConsultation({ name: 'phase-check', springYear: 2024, springAge: -16 });

    for (let index = 4; index < result.points.length; index += 1) {
      expect(result.points[index].means).toBe(result.points[index - 4].psychology);
      expect(result.points[index].wealth).toBe(result.points[index - 4].means);
      expect(result.points[index].honor).toBe(result.points[index - 4].wealth);
    }
  });

  it('trims the client name without changing the input values', () => {
    const result = calculateConsultation({ name: '  sample  ', springYear: 2024, springAge: -16 });

    expect(result.name).toBe('sample');
    expect(result.springYear).toBe(2024);
    expect(result.springAge).toBe(-16);
  });
});
