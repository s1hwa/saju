import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pencil, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Brand } from '../components/Brand';
import { FlowChart, type ChartRange, type FlowChartHandle } from '../components/FlowChart';
import { FlowToggle } from '../components/FlowToggle';
import { PrintReport } from '../components/PrintReport';
import { ResultActions } from '../components/ResultActions';
import { ResultHeader } from '../components/ResultHeader';
import { Seal } from '../components/Seal';
import { FLOW_DEFINITIONS } from '../constants/flows';
import type { ConsultationResult, FlowKey } from '../types/consultation';

interface ResultPageProps {
  result: ConsultationResult;
  consultationDate: Date;
  onEdit: () => void;
  onNew: () => void;
}

interface StatusMessage {
  tone: 'success' | 'error';
  text: string;
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export function ResultPage({ result, consultationDate, onEdit, onNew }: ResultPageProps) {
  const chartRef = useRef<FlowChartHandle>(null);
  const [visibleFlows, setVisibleFlows] = useState<Set<FlowKey>>(new Set(['psychology']));
  const [printChartImage, setPrintChartImage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [range, setRange] = useState<ChartRange>({
    start: result.displayStartIndex,
    end: result.points.length - 1,
  });

  const minIndex = result.displayStartIndex;
  const lastIndex = result.points.length - 1;
  const isFullRange = range.start === minIndex && range.end === lastIndex;
  const span = range.end - range.start;
  const firstPoint = result.points[range.start];
  const lastPoint = result.points[range.end];

  const toggleFlow = (flow: FlowKey, checked: boolean) => {
    setVisibleFlows((current) => {
      const next = new Set(current);
      if (checked) next.add(flow);
      else next.delete(flow);
      return next;
    });
  };

  const moveRange = (direction: -1 | 1) => {
    const step = Math.max(1, Math.ceil(span / 2)) * direction;
    chartRef.current?.setRange({ start: range.start + step, end: range.end + step });
  };

  const toggleFullRange = () => {
    if (isFullRange) chartRef.current?.fitToWidth();
    else chartRef.current?.setRange({ start: minIndex, end: lastIndex });
  };

  const runPrint = async (task: () => Promise<void>) => {
    setIsPrinting(true);
    setStatus(null);
    try {
      await task();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus({ tone: 'error', text: `처리하지 못했습니다: ${message}` });
    } finally {
      setIsPrinting(false);
    }
  };

  const preparePrint = async () => {
    const dataUrl = (await chartRef.current?.getImageDataUrl({ pixelRatio: 3 })) ?? null;
    setPrintChartImage(dataUrl);
    await nextPaint();
  };

  const print = () =>
    runPrint(async () => {
      await preparePrint();
      if (window.electronAPI) {
        const response = await window.electronAPI.print();
        if (!response.success && response.error) {
          setStatus({ tone: 'error', text: `인쇄하지 못했습니다: ${response.error}` });
        }
      } else {
        window.print();
      }
    });

  return (
    <>
      <div className="app-shell result-page screen-only">
        <header className="app-bar">
          <Brand />
          <nav className="app-bar-nav" aria-label="상담 작업">
            <button
              className="button button-quiet"
              type="button"
              onClick={onEdit}
              disabled={isPrinting}
            >
              <Pencil aria-hidden="true" size={15} />
              정보 수정
            </button>
            <button
              className="button button-outline"
              type="button"
              onClick={onNew}
              disabled={isPrinting}
            >
              <Plus aria-hidden="true" size={16} />
              새 상담
            </button>
            <ResultActions
              busy={isPrinting}
              onPrint={() => void print()}
            />
          </nav>
        </header>

        <main className="result-main">
          <div className="result-top">
            <div className="result-identity-row">
              <ResultHeader result={result} consultationDate={consultationDate} />
              <Seal year={result.springYear} />
            </div>
          </div>
          {status && (
              <p
                className={`export-status${status ? ` is-${status.tone}` : ''}`}
                role="status"
                aria-live="polite"
              >
                {status.text}
              </p>
          )}

          <section className="chart-panel" aria-label="인생 흐름 그래프">
            <div className="chart-toolbar">
              <div className="flow-toggles" role="group" aria-label="그래프에 표시할 흐름">
                {FLOW_DEFINITIONS.map((flow) => (
                  <FlowToggle
                    key={flow.key}
                    flow={flow}
                    checked={visibleFlows.has(flow.key)}
                    onChange={toggleFlow}
                  />
                ))}
              </div>

              <div className="range-nav">
                {firstPoint && lastPoint && (
                  <p className="range-label">
                    <span>
                      {firstPoint.year}년 {firstPoint.age}세
                    </span>
                    <span className="range-dash" aria-hidden="true">–</span>
                    <span>
                      {lastPoint.year}년 {lastPoint.age}세
                    </span>
                  </p>
                )}
                <div className="range-buttons">
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => moveRange(-1)}
                    disabled={range.start === minIndex}
                    aria-label="이전 구간"
                    title="이전 구간"
                  >
                    <ChevronLeft aria-hidden="true" size={17} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => moveRange(1)}
                    disabled={range.end === lastIndex}
                    aria-label="다음 구간"
                    title="다음 구간"
                  >
                    <ChevronRight aria-hidden="true" size={17} />
                  </button>
                  <button
                    className="button button-quiet button-small range-mode"
                    type="button"
                    onClick={toggleFullRange}
                  >
                    {isFullRange ? (
                      <Minimize2 aria-hidden="true" size={14} />
                    ) : (
                      <Maximize2 aria-hidden="true" size={14} />
                    )}
                    {isFullRange ? '화면 맞춤' : '전체 보기'}
                  </button>
                </div>
              </div>
            </div>

            <div className="chart-body">
              {visibleFlows.size === 0 && (
                <div className="empty-chart-state">
                  <strong>표시 중인 흐름이 없습니다</strong>
                  <span>위에서 심리 · 수단 · 재물 · 명예 중 하나 이상을 선택해 주세요.</span>
                </div>
              )}
              <FlowChart
                ref={chartRef}
                result={result}
                visibleFlows={visibleFlows}
                onRangeChange={setRange}
              />
            </div>
          </section>
        </main>
      </div>

      <PrintReport
        result={result}
        consultationDate={consultationDate}
        visibleFlows={visibleFlows}
        chartImage={printChartImage}
      />
    </>
  );
}
