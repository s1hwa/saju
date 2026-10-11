import { ArrowLeft } from 'lucide-react';
import { Brand } from '../components/Brand';
import { ConsultationForm } from '../components/ConsultationForm';
import {
  BRAND_CONSULTANT,
  BRAND_NAME,
  BRAND_PHONE,
  BRAND_SERVICES,
  BRAND_SLOGAN,
} from '../constants/config';
import type { ConsultationInput } from '../types/consultation';
import { formatConsultationDate } from '../utils/format';

interface ConsultationPageProps {
  initialValue?: ConsultationInput;
  onSubmit: (input: ConsultationInput) => void;
  /** 정보 수정 중일 때만 전달된다. */
  onCancel?: () => void;
}

export function ConsultationPage({ initialValue, onSubmit, onCancel }: ConsultationPageProps) {
  const isEditing = Boolean(initialValue);

  return (
    <div className="app-shell entry-page screen-only">
      <header className="app-bar">
        <Brand />
        <span className="app-bar-date">{formatConsultationDate(new Date())}</span>
      </header>

      <main className="entry-main">
        <div className="entry-column">
          {onCancel && (
            <button className="button button-quiet button-small entry-back" type="button" onClick={onCancel}>
              <ArrowLeft aria-hidden="true" size={15} />
              결과로 돌아가기
            </button>
          )}
          <header className="entry-heading">
            {isEditing && <p className="eyebrow">정보 수정</p>}
            <h1>{isEditing ? '상담 정보를 확인해 주세요' : '상담 정보 입력'}</h1>
          </header>

          <ConsultationForm initialValue={initialValue} onSubmit={onSubmit} />
        </div>
      </main>

      <footer className="entry-signature">
        <span className="entry-signature-name">{BRAND_NAME}</span>
        <span>{BRAND_SLOGAN}</span>
        <span aria-hidden="true">·</span>
        <span>{BRAND_SERVICES.join(' · ')}</span>
        <span aria-hidden="true">·</span>
        <span>{BRAND_CONSULTANT}</span>
        <span aria-hidden="true">·</span>
        <span>{BRAND_PHONE}</span>
      </footer>
    </div>
  );
}
