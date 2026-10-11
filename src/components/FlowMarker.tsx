import type { FlowSymbol } from '../types/consultation';

interface FlowMarkerProps {
  color: string;
  symbol: FlowSymbol;
}

const SHAPES: Record<FlowSymbol, string> = {
  circle: 'M 14 4.6 a 3.4 3.4 0 1 0 0.01 0 Z',
  rect: 'M 11 5 h 6 v 6 h -6 Z',
  triangle: 'M 14 3.8 L 18 11 L 10 11 Z',
  diamond: 'M 14 3.4 L 18.4 8 L 14 12.6 L 9.6 8 Z',
};

/** 그래프의 선과 속 빈 데이터 표식을 그대로 축소한 범례 표식 */
export function FlowMarker({ color, symbol }: FlowMarkerProps) {
  return (
    <svg className="flow-marker" width="28" height="16" viewBox="0 0 28 16" aria-hidden="true">
      <path d="M 1.5 8 H 26.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d={SHAPES[symbol]} fill="var(--paper-hi, #fbf6ea)" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
