import { LineChart } from 'echarts/charts';
import {
  AriaComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { init, use, type EChartsType } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { BRAND_NAME, POINT_COUNT } from '../constants/config';
import { FLOW_DEFINITIONS } from '../constants/flows';
import { SOLAR_TERMS } from '../constants/solarTerms';
import type { ConsultationResult, FlowDefinition, FlowKey } from '../types/consultation';
import { formatFlowValue } from '../utils/format';

use([
  LineChart,
  GridComponent,
  TooltipComponent,
  AriaComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  MarkLineComponent,
  TitleComponent,
  LegendComponent,
  SVGRenderer,
]);

export interface ChartRange {
  start: number;
  end: number;
}

export interface ChartExportOptions {
  /** PNG 단독 저장 시 고객명과 범례를 그림 안에 포함한다. */
  withHeading?: boolean;
  pixelRatio?: number;
}

export interface FlowChartHandle {
  /** 화면 확대 상태와 관계없이 전체 시점을 고해상도 PNG로 만든다. */
  getImageDataUrl: (options?: ChartExportOptions) => Promise<string | null>;
  setRange: (range: ChartRange) => void;
  /** 현재 화면 폭에서 라벨을 읽을 수 있는 구간으로 맞춘다. */
  fitToWidth: () => void;
}

interface FlowChartProps {
  result: ConsultationResult;
  visibleFlows: ReadonlySet<FlowKey>;
  onRangeChange?: (range: ChartRange) => void;
}

interface TooltipItem {
  axisValue: string;
  seriesIndex: number;
  value: number | null;
}

const INK = '#1f1b16';
const MUTED = '#6d6356';
const FAINT = '#9a8d78';
const RULE = '#dccfb2';
const PAPER = '#fbf6ea';
// SVG 속성 안에 들어가므로 따옴표 없이 적는다. 따옴표가 있으면 PNG 변환이 실패한다.
// PNG 변환 시 SVG 이미지는 문서의 웹폰트를 쓰지 못하므로 Windows 기본 바탕체로 대체된다.
const BODY_FONT = 'Nanum Myeongjo, Batang, 바탕, serif';
const TITLE_FONT = 'Song Myung, Nanum Myeongjo, Batang, 바탕, serif';
const MIN_POINT_WIDTH = 34;
const EXPORT_WIDTH = 1400;
const EXPORT_HEIGHT = 660;
const AGE_YEAR_LABEL_STEP = 2;

type Mode = 'screen' | 'export';

function buildOption(
  result: ConsultationResult,
  displayPoints: ConsultationResult['points'],
  activeFlows: readonly FlowDefinition[],
  mode: Mode,
  withHeading = false,
  labelInterval = 0,
): EChartsOption {
  const isExport = mode === 'export';
  const top = isExport && withHeading ? 96 : isExport ? 28 : 22;
  const springPointIndex = displayPoints.findIndex((point) => point.solarTerm === SOLAR_TERMS[0]);

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  return {
    animation: !isExport && !reduceMotion,
    animationDuration: 420,
    animationDurationUpdate: 260,
    animationEasing: 'cubicOut',
    aria: { enabled: true },
    textStyle: {
      fontFamily: BODY_FONT,
    },
    title: isExport && withHeading
      ? {
          left: 64,
          top: 22,
          text: `${result.name} 님의 인생 흐름`,
          subtext: `생년 ${result.springYear}년 · 입춘나이 ${result.springAge}세 · ${POINT_COUNT}개 시점`,
          itemGap: 8,
          textStyle: { color: INK, fontSize: 26, fontWeight: 400, fontFamily: TITLE_FONT },
          subtextStyle: { color: MUTED, fontSize: 13 },
        }
      : undefined,
    legend: isExport && withHeading
      ? {
          right: 32,
          top: 30,
          itemWidth: 26,
          itemHeight: 10,
          itemGap: 22,
          textStyle: { color: INK, fontSize: 14, fontWeight: 700 },
          data: activeFlows.map((flow) => flow.label),
        }
      : undefined,
    grid: {
      left: isExport ? 64 : 56,
      right: isExport ? 44 : 30,
      top,
      bottom: isExport ? 104 : 100,
      containLabel: false,
    },
    tooltip: isExport
      ? undefined
      : {
          trigger: 'axis',
          confine: true,
          backgroundColor: INK,
          borderWidth: 0,
          padding: [12, 14],
          extraCssText: 'border-radius:2px;box-shadow:0 10px 30px rgba(31,27,22,.28);',
          textStyle: { color: '#f6ecd8', fontSize: 12, fontFamily: BODY_FONT },
          axisPointer: {
            type: 'line',
            lineStyle: { color: FAINT, type: [3, 3], width: 1 },
          },
          formatter: (params: unknown) => {
            const items = (Array.isArray(params) ? params : []) as TooltipItem[];
            const first = items[0];
            if (!first) return '';
            const point = displayPoints[Number(first.axisValue)];
            const rows = items
              .filter((item) => typeof item.value === 'number')
              .map((item) => {
                const flow = activeFlows[item.seriesIndex];
                return `<div class="tt-row"><span><i class="tt-mark tt-${flow.symbol}" style="--mark:${flow.color}"></i>${flow.hanja} ${flow.label}</span><strong>${formatFlowValue(item.value as number)}</strong></div>`;
              })
              .join('');
            const empty = rows ? '' : '<div class="tt-empty">이 시점에는 값이 없습니다</div>';
            return `<div class="tt-head"><strong>${point.age}세</strong><em>${point.year}년</em><span>${point.solarTerm}</span></div>${rows}${empty}`;
          },
        },
    dataZoom: isExport
      ? undefined
      : [
          {
            type: 'inside',
            xAxisIndex: 0,
            minValueSpan: 7,
            zoomOnMouseWheel: 'ctrl',
            moveOnMouseWheel: true,
            moveOnMouseMove: true,
          },
          {
            type: 'slider',
            xAxisIndex: 0,
            minValueSpan: 7,
            height: 22,
            bottom: 8,
            left: 56,
            right: 30,
            showDetail: false,
            brushSelect: false,
            borderColor: '#b9a988',
            borderRadius: 0,
            backgroundColor: 'rgba(237, 228, 207, 0.6)',
            fillerColor: 'rgba(168, 50, 42, 0.08)',
            dataBackground: {
              lineStyle: { color: '#c7b896', width: 1 },
              areaStyle: { color: 'rgba(31, 27, 22, 0.04)' },
            },
            selectedDataBackground: {
              lineStyle: { color: '#6d6356', width: 1 },
              areaStyle: { color: 'rgba(31, 27, 22, 0.08)' },
            },
            handleIcon: 'path://M-3,-9 L3,-9 L3,9 L-3,9 Z',
            handleSize: '100%',
            handleStyle: { color: PAPER, borderColor: '#8c7b5e', borderWidth: 1 },
            moveHandleSize: 0,
            emphasis: { handleStyle: { borderColor: INK } },
          },
        ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      // 카테고리 값은 배열 위치다. 라벨 formatter의 index는 확대 구간 기준이라 값을 사용해야 한다.
      data: displayPoints.map((_point, position) => String(position)),
      axisLine: { onZero: false, lineStyle: { color: '#8c7b5e' } },
      axisTick: { alignWithLabel: true, length: 4, lineStyle: { color: '#8c7b5e' } },
      splitLine: { show: true, lineStyle: { color: 'rgba(140, 123, 94, 0.14)' } },
      axisLabel: {
        interval: isExport ? 0 : labelInterval,
        margin: 12,
        formatter: (value: string) => {
          const index = Number(value);
          const point = displayPoints[index];
          if (!point) return '';
          return (index - springPointIndex) % AGE_YEAR_LABEL_STEP === 0
            ? `{age|${point.age}세}\n{year|${point.year}}\n{term|${point.solarTerm}}`
            : `{spacer| }\n{spacer| }\n{termOnly|${point.solarTerm}}`;
        },
        rich: {
          spacer: {
            fontSize: isExport ? 10.5 : 11.5,
            lineHeight: isExport ? 14 : 15,
          },
          term: {
            color: INK,
            fontFamily: TITLE_FONT,
            fontSize: isExport ? 12 : 13.5,
            lineHeight: isExport ? 16 : 18,
          },
          termOnly: {
            color: INK,
            fontFamily: TITLE_FONT,
            fontSize: isExport ? 12 : 13.5,
            fontWeight: 700,
            lineHeight: isExport ? 16 : 18,
          },
          year: {
            color: INK,
            fontSize: isExport ? 10.5 : 11.5,
            fontWeight: 700,
            lineHeight: isExport ? 14 : 15,
          },
          age: {
            color: INK,
            fontSize: isExport ? 10.5 : 11.5,
            fontWeight: 700,
            lineHeight: isExport ? 14 : 15,
          },
        },
      },
    },
    yAxis: {
      type: 'value',
      min: -12.5,
      max: 22.5,
      interval: 2.5,
      axisLabel: {
        color: MUTED,
        fontSize: isExport ? 12 : 11,
        formatter: (value: number) => (value % 5 === 0 ? formatFlowValue(value) : ''),
      },
      splitLine: {
        lineStyle: { color: RULE, type: 'solid' },
      },
    },
    series: activeFlows.map((flow, index) => ({
      id: flow.key,
      name: flow.label,
      type: 'line' as const,
      data: displayPoints.map((point) => point[flow.key]),
      // 같은 기울기로 이어지는 구간은 직선으로 두고 방향이 바뀌는 모서리만 둥글린다.
      // smoothMonotone은 점마다 선을 평평하게 눌러 계단처럼 보이게 하므로 쓰지 않는다.
      // 꼭짓점 좌우 값이 같아 접선이 수평이 되므로 곡선이 최댓값·최솟값을 넘지 않는다.
      smooth: 0.32,
      connectNulls: false,
      showSymbol: true,
      symbol: flow.symbol,
      symbolSize: flow.symbol === 'triangle' || flow.symbol === 'diamond' ? 9 : 7,
      z: 10 - index,
      lineStyle: { width: isExport ? 2 : 1.9, color: flow.color, cap: 'round', join: 'round' },
      // 한지 결과지처럼 표식은 속을 비워 먹선으로만 찍는다.
      itemStyle: { color: PAPER, borderColor: flow.color, borderWidth: 1.6 },
      emphasis: { focus: 'none', scale: 1.5 },
      markLine:
        index === 0
          ? {
              silent: true,
              symbol: 'none',
              label: { show: false },
              lineStyle: { color: MUTED, width: 1.1, type: 'solid' },
              emphasis: { disabled: true },
              data: [{ yAxis: 0 }],
            }
          : undefined,
    })),
  };
}

async function convertSvgToPng(
  svgDataUrl: string,
  width: number,
  height: number,
  pixelRatio: number,
): Promise<string> {
  const image = new Image();
  image.src = svgDataUrl;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('PNG 변환용 캔버스를 만들 수 없습니다.');

  context.fillStyle = PAPER;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  // 메신저로 그림만 전달돼도 출처가 남도록 오른쪽 아래에 상호를 작게 적는다.
  const signatureFont = `${12 * pixelRatio}px "Song Myung", Batang, serif`;
  await document.fonts.load(signatureFont, BRAND_NAME).catch(() => undefined);
  context.font = signatureFont;
  context.fillStyle = FAINT;
  context.textAlign = 'right';
  context.textBaseline = 'alphabetic';
  context.letterSpacing = `${1.5 * pixelRatio}px`;
  context.fillText(BRAND_NAME, canvas.width - 14 * pixelRatio, canvas.height - 14 * pixelRatio);

  return canvas.toDataURL('image/png');
}

function readRange(chart: EChartsType, pointCount: number): ChartRange {
  const option = chart.getOption() as { dataZoom?: Array<{ start?: number; end?: number }> };
  const zoom = option.dataZoom?.[0];
  const last = pointCount - 1;
  const start = Math.round(((zoom?.start ?? 0) / 100) * last);
  const end = Math.round(((zoom?.end ?? 100) / 100) * last);
  return { start, end };
}

function labelIntervalFor(width: number, span: number): number {
  const pointWidth = Math.max(0, width - 80) / Math.max(1, span);
  return Math.max(0, Math.ceil(MIN_POINT_WIDTH / Math.max(1, pointWidth)) - 1);
}

function initialRange(width: number, pointCount: number, minStart = 0): ChartRange {
  const plotWidth = Math.max(0, width - 80);
  const fitting = Math.max(8, Math.floor(plotWidth / MIN_POINT_WIDTH) + 1);
  return { start: minStart, end: Math.min(pointCount - 1, minStart + fitting - 1) };
}

function toOriginalRange(range: ChartRange, displayStartIndex: number): ChartRange {
  return {
    start: range.start + displayStartIndex,
    end: range.end + displayStartIndex,
  };
}

function toDisplayRange(range: ChartRange, displayStartIndex: number): ChartRange {
  return {
    start: range.start - displayStartIndex,
    end: range.end - displayStartIndex,
  };
}

export const FlowChart = forwardRef<FlowChartHandle, FlowChartProps>(function FlowChart(
  { result, visibleFlows, onRangeChange },
  forwardedRef,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const onRangeChangeRef = useRef(onRangeChange);
  onRangeChangeRef.current = onRangeChange;
  const displayStartIndex = result.displayStartIndex;
  const displayPoints = result.points.slice(displayStartIndex);
  const pointCount = displayPoints.length;
  const minStart = 0;
  const activeFlows = FLOW_DEFINITIONS.filter((flow) => visibleFlows.has(flow.key));

  const labelIntervalRef = useRef(0);

  // 보이는 구간의 점 간격이 좁으면 라벨을 겹치지 않게 일정 간격으로 건너뛴다.
  const syncLabels = (chart: EChartsType, host: HTMLElement) => {
    const range = readRange(chart, pointCount);
    const interval = labelIntervalFor(host.clientWidth, range.end - range.start);
    if (interval !== labelIntervalRef.current) {
      labelIntervalRef.current = interval;
      chart.setOption({ xAxis: { axisLabel: { interval } } });
    }
    return range;
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = init(host, undefined, { renderer: 'svg' });
    chartRef.current = chart;
    let frame = 0;
    // 관찰 콜백 안에서 바로 다시 그리면 ResizeObserver 루프 경고가 나므로 다음 프레임으로 미룬다.
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (chart.isDisposed()) return;
        chart.resize();
        syncLabels(chart, host);
      });
    });
    resizeObserver.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 결과가 바뀌면 화면 폭에 맞는 구간으로 다시 시작한다.
  useEffect(() => {
    const chart = chartRef.current;
    const host = hostRef.current;
    if (!chart || !host) return;
    const range = initialRange(host.clientWidth, pointCount, minStart);
    labelIntervalRef.current = labelIntervalFor(host.clientWidth, range.end - range.start);
    chart.setOption(buildOption(result, displayPoints, activeFlows, 'screen', false, labelIntervalRef.current), {
      notMerge: true,
    });
    chart.dispatchAction({ type: 'dataZoom', dataZoomIndex: 0, startValue: range.start, endValue: range.end });
    onRangeChangeRef.current?.(toOriginalRange(readRange(chart, pointCount), displayStartIndex));

    const handleZoom = () => {
      const nextRange = syncLabels(chart, host);
      if (nextRange.start < minStart) {
        chart.dispatchAction({
          type: 'dataZoom',
          dataZoomIndex: 0,
          startValue: minStart,
          endValue: Math.min(pointCount - 1, minStart + (nextRange.end - nextRange.start)),
        });
        return;
      }
      onRangeChangeRef.current?.(toOriginalRange(nextRange, displayStartIndex));
    };
    chart.on('datazoom', handleZoom);
    return () => {
      chart.off('datazoom', handleZoom);
    };
    // 시리즈 변경은 아래 효과에서 처리하므로 result 변경에만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // 시리즈 토글은 확대 구간을 유지한 채 선만 교체한다.
  const flowKey = activeFlows.map((flow) => flow.key).join(',');
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const chart = chartRef.current;
    if (!chart) return;
    const option = buildOption(result, displayPoints, activeFlows, 'screen', false, labelIntervalRef.current);
    delete option.dataZoom;
    chart.setOption(option, { replaceMerge: ['series'] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowKey]);

  useImperativeHandle(forwardedRef, () => ({
    getImageDataUrl: async ({ withHeading = false, pixelRatio = 2.5 } = {}) => {
      const host = document.createElement('div');
      host.style.cssText = `position:fixed;left:-20000px;top:0;width:${EXPORT_WIDTH}px;height:${EXPORT_HEIGHT}px;`;
      document.body.appendChild(host);
      const chart = init(host, undefined, { renderer: 'svg', width: EXPORT_WIDTH, height: EXPORT_HEIGHT });
      try {
        chart.setOption(buildOption(result, displayPoints, activeFlows, 'export', withHeading));
        const svgDataUrl = chart.getDataURL({ type: 'svg', backgroundColor: PAPER });
        return await convertSvgToPng(svgDataUrl, EXPORT_WIDTH, EXPORT_HEIGHT, pixelRatio);
      } finally {
        chart.dispose();
        host.remove();
      }
    },
    fitToWidth: () => {
      const host = hostRef.current;
      if (!host) return;
      const range = initialRange(host.clientWidth, pointCount, minStart);
      chartRef.current?.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 0,
        startValue: range.start,
        endValue: range.end,
      });
    },
    setRange: ({ start, end }) => {
      const last = pointCount - 1;
      const displayRange = toDisplayRange({ start, end }, displayStartIndex);
      const span = displayRange.end - displayRange.start;
      const clampedStart = Math.max(minStart, Math.min(displayRange.start, last - span));
      chartRef.current?.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 0,
        startValue: clampedStart,
        endValue: clampedStart + span,
      });
    },
  }));

  return <div ref={hostRef} className="flow-chart" role="img" aria-label="인생 흐름 그래프" />;
});
