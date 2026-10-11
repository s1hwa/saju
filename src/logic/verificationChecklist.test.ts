import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOption, toDisplayRange, toOriginalRange } from '../components/FlowChart';
import { PrintReport } from '../components/PrintReport';
import { FLOW_VALUES, EXCLUDED_UNMATCHED_VALUES } from '../constants/cycleData';
import { FLOW_DEFINITIONS } from '../constants/flows';
import { calculateConsultation } from './calculateConsultation';

const resultFor = (springAge: number) => calculateConsultation({
  name: '  Checklist client  ', springYear: 2003, springAge,
});

afterEach(() => vi.unstubAllGlobals());

describe('README 4-1-1 calculation acceptance criteria', () => {
  it('C01: retains 38 ordered Excel values and documents the excluded 39th value', () => {
    const result = resultFor(1);
    for (const flow of FLOW_DEFINITIONS) {
      expect(FLOW_VALUES[flow.key]).toHaveLength(38);
      FLOW_VALUES[flow.key].forEach((value, index) => {
        if (value !== null) expect(result.points[index][flow.key]).toBe(value);
      });
    }
    expect(result.points[0].psychology).toBe(-10);
    expect(result.points[37].psychology).toBe(17.5);
    expect(EXCLUDED_UNMATCHED_VALUES).toEqual({ psychology: 15, means: 15, wealth: 5, honor: -5 });
  });

  it.each([-103, -16, -5, -4, -3, -2, -1, 0, ...Array.from({ length: 15 }, (_, i) => i + 1)])(
    'C02-C09: coherent points, calendar, cycles and phase spacing for age %i', (age) => {
      const result = resultFor(age);
      const visible = result.points.slice(result.displayStartIndex);
      expect(result.springYear).toBe(2003);
      expect(result.points).toHaveLength(41);
      expect(visible).toHaveLength(result.graphStartAge === -1 ? 40 : 41);
      expect(visible.every((point) => point.age >= 0)).toBe(true);
      if (age > 0) {
        expect(result.points.find((point) => point.age === age)?.solarTerm).toBe('입춘');
      }
      result.points.forEach((point, index) => {
        expect(point.index).toBe(index);
        expect(point.year).toBe(2003 + point.age - 1);
        for (const flow of FLOW_DEFINITIONS) expect(Number.isFinite(point[flow.key])).toBe(true);
        if (index >= 4) {
          expect(point.age - result.points[index - 4].age).toBe(10);
          expect(point.means).toBe(result.points[index - 4].psychology);
          expect(point.wealth).toBe(result.points[index - 4].means);
          expect(point.honor).toBe(result.points[index - 4].wealth);
        }
        if (index >= 24) {
          expect(point.solarTerm).toBe(result.points[index - 24].solarTerm);
          for (const flow of FLOW_DEFINITIONS) {
            expect(point[flow.key]).toBe(result.points[index - 24][flow.key]);
          }
        }
      });
    },
  );

  it.each([
    { age: 7, visible: [0, 2, 5, 7] },
    { age: 9, visible: [1, 4, 6, 9] },
    { age: -16, visible: [1, 4, 6, 9] },
    { age: -3, visible: [2, 4, 7, 9] },
  ])('C05-C07: concrete visible ages for $age', ({ age, visible }) => {
    const result = resultFor(age);
    expect(result.points.slice(result.displayStartIndex, result.displayStartIndex + 4).map((p) => p.age))
      .toEqual(visible);
  });
});

describe('README 4-1-2 chart and output acceptance criteria', () => {
  it.each([-16, -3, 7, 9])('U03-U04: labels, tooltip, series and navigator agree for age %i', (age) => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const result = resultFor(age);
    const points = result.points.slice(result.displayStartIndex);
    const option = buildOption(result, points, FLOW_DEFINITIONS, 'screen') as unknown as {
      xAxis: { data: string[]; axisLabel: { formatter: (value: string) => string } };
      series: Array<{ id: string; data: number[] }>;
      tooltip: { formatter: (items: unknown[]) => string };
    };
    expect(option.xAxis.data).toHaveLength(points.length);
    points.forEach((point, index) => {
      const label = option.xAxis.axisLabel.formatter(String(index));
      expect(label).toContain(point.solarTerm);
      const items = FLOW_DEFINITIONS.map((flow, seriesIndex) => ({
        axisValue: String(index), seriesIndex, value: point[flow.key],
      }));
      const tooltip = option.tooltip.formatter(items);
      expect(tooltip).toContain(`${point.age}세`);
      expect(tooltip).toContain(`${point.year}년`);
      expect(tooltip).toContain(point.solarTerm);
      FLOW_DEFINITIONS.forEach((flow, seriesIndex) => {
        expect(option.series[seriesIndex].id).toBe(flow.key);
        expect(option.series[seriesIndex].data[index]).toBe(point[flow.key]);
        expect(tooltip).toContain(flow.label);
      });
      const range = { start: index, end: Math.min(index + 7, points.length - 1) };
      const original = toOriginalRange(range, result.displayStartIndex);
      expect(result.points[original.start]).toBe(point);
      expect(toDisplayRange(original, result.displayStartIndex)).toEqual(range);
    });
  });

  it.each([{ flows: [] }, { flows: [FLOW_DEFINITIONS[0]] }, { flows: FLOW_DEFINITIONS }])(
    'U02-U05: screen and export use only selected flows ($flows)', ({ flows }) => {
      vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
      const result = resultFor(9);
      const points = result.points.slice(result.displayStartIndex);
      const screen = buildOption(result, points, flows, 'screen');
      const exported = buildOption(result, points, flows, 'export', true);
      const series = (option: typeof screen) => (option.series as Array<{ id: string; data: unknown[] }>);
      expect(series(screen).map((s) => s.id)).toEqual(flows.map((flow) => flow.key));
      expect(series(exported).map((s) => ({ id: s.id, data: s.data })))
        .toEqual(series(screen).map((s) => ({ id: s.id, data: s.data })));
      expect(exported.dataZoom).toBeUndefined();
      expect(exported.tooltip).toBeUndefined();
    },
  );

  it('U01-U05: report contains trimmed input, selected legend and supplied chart image', () => {
    const result = resultFor(-3);
    const image = 'data:image/png;base64,checklist';
    const html = renderToStaticMarkup(PrintReport({
      result, consultationDate: new Date(2026, 9, 11),
      visibleFlows: new Set(['wealth']), chartImage: image,
    }));
    expect(result.name).toBe('Checklist client');
    expect(html).toContain(result.name);
    expect(html).toContain('2003');
    expect(html).toContain('-3');
    expect(html).toContain(image);
    expect(html).toContain('재물');
    expect(html).not.toContain('print-legend-hanja">心');
    expect((html.match(/class="print-legend-item"/g) ?? [])).toHaveLength(1);
  });

  it.skip('U07: print on an actual customer printer and inspect clipping/overlap', () => {});
  it.skip('U08: install and run the delivered executable offline on the customer PC', () => {});
});
