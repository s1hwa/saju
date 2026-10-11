import type { FlowDefinition } from '../types/consultation';

/** 흐름 색은 오방색(청·적·황·흑)에서 가져온다. 흑백 출력에서도 표식 모양으로 구분된다. */
export const FLOW_DEFINITIONS: readonly FlowDefinition[] = [
  { key: 'psychology', label: '심리', hanja: '心理', color: '#2c5e6e', symbol: 'circle' },
  { key: 'means', label: '수단', hanja: '手段', color: '#a8362a', symbol: 'rect' },
  { key: 'wealth', label: '재물', hanja: '財物', color: '#b8871b', symbol: 'triangle' },
  { key: 'honor', label: '명예', hanja: '名譽', color: '#2b2723', symbol: 'diamond' },
];
