export type FlowKey = 'psychology' | 'means' | 'wealth' | 'honor';
export type FlowValue = number | null;

export interface ConsultationInput {
  name: string;
  springYear: number;
  springAge: number;
}

export interface FlowPoint {
  index: number;
  solarTerm: string;
  year: number;
  age: number;
  psychology: FlowValue;
  means: FlowValue;
  wealth: FlowValue;
  honor: FlowValue;
}

export interface ConsultationResult extends ConsultationInput {
  startYear: number;
  startSolarTerm: string;
  graphStartAge: number;
  displayStartIndex: number;
  intervalYears: number;
  points: FlowPoint[];
}

export type FlowSymbol = 'circle' | 'rect' | 'triangle' | 'diamond';

export interface FlowDefinition {
  key: FlowKey;
  label: string;
  /** 한지 결과지에서 라벨 앞에 붙이는 한자 표기 */
  hanja: string;
  color: string;
  symbol: FlowSymbol;
}

export interface ExportResult {
  canceled: boolean;
  filePath?: string;
}

export interface ElectronApi {
  savePdf: (suggestedName: string) => Promise<ExportResult>;
  print: () => Promise<{ success: boolean; error?: string }>;
  savePng: (dataUrl: string, suggestedName: string) => Promise<ExportResult>;
}
