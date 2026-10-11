import { yearGanji } from '../constants/hanja';
import type { ConsultationResult } from '../types/consultation';
import { formatConsultationDate } from '../utils/format';

interface ResultHeaderProps {
  result: ConsultationResult;
  consultationDate: Date;
}

export function ResultHeader({ result, consultationDate }: ResultHeaderProps) {
  const ganji = yearGanji(result.springYear);
  return (
    <div className="result-identity">
      <h1>
        {result.name}
        <span className="honorific">님의 인생 흐름</span>
      </h1>
      <dl className="meta-list">
        <div>
          <dt>생년</dt>
          <dd>
            {result.springYear}년
            <span className="meta-ganji">{ganji.hanja}</span>
          </dd>
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
    </div>
  );
}
