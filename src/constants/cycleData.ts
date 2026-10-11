import type { FlowKey, FlowValue } from '../types/consultation';

// Exact C46:AN46 offsets from the workbook's first worksheet.
export const YEAR_OFFSETS = [
  0, 2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40,
  42, 45, 47, 50, 52, 55, 57, 60, 62, 65, 67, 70, 72, 75, 77, 80, 82,
  85, 87, 90, 92, 95, 97, 100,
] as const;

// Each array uses workbook cells B:AM. The unmatched AN value is documented and excluded.
export const FLOW_VALUES: Readonly<Record<FlowKey, readonly FlowValue[]>> = {
  psychology: [
    -10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 17.5,
    15, 12.5, 10, 7.5, 5, 2.5, 0, -2.5, -5, -7.5, -10, -7.5, -5, -2.5,
    0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 17.5,
  ],
  means: [
    null, null, null, null, -10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10, 12.5,
    15, 17.5, 20, 17.5, 15, 12.5, 10, 7.5, 5, 2.5, 0, -2.5, -5, -7.5,
    -10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10, 12.5,
  ],
  wealth: [
    null, null, null, null, null, null, null, null, -10, -7.5, -5, -2.5, 0,
    2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 17.5, 15, 12.5, 10, 7.5, 5,
    2.5, 0, -2.5, -5, -7.5, -10, -7.5, -5, -2.5, 0, 2.5,
  ],
  honor: [
    null, null, null, null, null, null, null, null, null, null, null, null,
    -10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 17.5,
    15, 12.5, 10, 7.5, 5, 2.5, 0, -2.5, -5, -7.5, -10, -7.5,
  ],
};

// 입춘에서 시작하는 60년(24절기) 기본 파형. 각 흐름은 10년, 즉 4칸씩 어긋난다.
export const FLOW_CYCLE = FLOW_VALUES.psychology.slice(0, 24) as readonly number[];

export const FLOW_PHASE_OFFSETS: Readonly<Record<FlowKey, number>> = {
  psychology: 0,
  means: 4,
  wealth: 8,
  honor: 12,
};

export const EXCLUDED_UNMATCHED_VALUES: Readonly<Record<FlowKey, number>> = {
  psychology: 15,
  means: 15,
  wealth: 5,
  honor: -5,
};
