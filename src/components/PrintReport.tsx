import { FLOW_DEFINITIONS } from '../constants/flows';
import {
  BRAND_CONSULTANT,
  BRAND_NAME,
  BRAND_PHONE,
  BRAND_SERVICES,
  BRAND_SLOGAN,
  PROGRAM_NAME,
} from '../constants/config';
import type { ConsultationResult, FlowKey } from '../types/consultation';
import { formatConsultationDate } from '../utils/format';
import { FlowMarker } from './FlowMarker';
import { LogoMark } from './LogoMark';
import { Seal } from './Seal';

interface PrintReportProps {
  result: ConsultationResult;
  consultationDate: Date;
  visibleFlows: ReadonlySet<FlowKey>;
  chartImage: string | null;
}

export function PrintReport({
  result,
  consultationDate,
  visibleFlows,
  chartImage,
}: PrintReportProps) {
  const activeFlows = FLOW_DEFINITIONS.filter((flow) => visibleFlows.has(flow.key));

  return (
    <article className="print-report" aria-hidden="true">
      <header className="print-header">
        <div className="print-brand">
          <LogoMark className="print-logo" detail="full" border={3} />
          <div className="print-brand-text">
            <span className="print-brand-slogan">{BRAND_SLOGAN}</span>
          </div>
        </div>
        <span className="print-brand-name">{BRAND_NAME}</span>
        <div className="print-header-meta">
          <span className="print-program">{PROGRAM_NAME} 결과지</span>
          <span className="print-date">{formatConsultationDate(consultationDate)}</span>
        </div>
      </header>

      <section className="print-title">
        <h1>
          {result.name}
          <span> 님의 인생 흐름</span>
        </h1>
        <dl>
          <div>
            <dt>생년</dt>
            <dd>{result.springYear}년</dd>
          </div>
          <div>
            <dt>입춘나이</dt>
            <dd>{result.springAge}세</dd>
          </div>
          <div>
            <dt>상담일</dt>
            <dd>{formatConsultationDate(consultationDate)}</dd>
          </div>
        </dl>
        <Seal year={result.springYear} className="print-seal" />
      </section>

      <div className="print-legend">
        <span className="print-legend-caption">표시 항목</span>
        {activeFlows.map((flow) => (
          <span key={flow.key} className="print-legend-item">
            <FlowMarker color={flow.color} symbol={flow.symbol} />
            <span className="print-legend-hanja">{flow.hanja}</span>
            {flow.label}
          </span>
        ))}
      </div>

      <div className="print-chart-frame">
        {chartImage && <img src={chartImage} alt="선택한 인생 흐름 그래프" />}
      </div>

      <footer className="print-footer">
        <span className="print-footer-name">{BRAND_NAME}</span>
        <span>{BRAND_SERVICES.join(' · ')}</span>
        <span className="print-footer-contact">
          상담 <b>{BRAND_CONSULTANT}</b> {BRAND_PHONE}
        </span>
      </footer>
    </article>
  );
}
