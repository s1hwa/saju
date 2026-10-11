import { ArrowRight, CircleAlert, CornerDownLeft } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { yearGanji } from '../constants/hanja';
import type { ConsultationInput } from '../types/consultation';

interface ConsultationFormProps {
  initialValue?: ConsultationInput;
  onSubmit: (input: ConsultationInput) => void;
}

interface FormState {
  name: string;
  springYear: string;
  springAge: string;
}

type FieldKey = keyof FormState;

interface FormError {
  field: FieldKey;
  message: string;
}

const FIELD_IDS: Record<FieldKey, string> = {
  name: 'client-name',
  springYear: 'start-year',
  springAge: 'spring-age',
};

export function ConsultationForm({ initialValue, onSubmit }: ConsultationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>({
    name: initialValue?.name ?? '',
    springYear: initialValue ? String(initialValue.springYear) : '',
    springAge: initialValue ? String(initialValue.springAge) : '',
  });
  const [error, setError] = useState<FormError | null>(null);
  const isEditing = Boolean(initialValue);

  const update = (field: FieldKey, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error?.field === field) setError(null);
  };

  const fail = (field: FieldKey, message: string) => {
    setError({ field, message });
    formRef.current?.querySelector<HTMLElement>(`#${FIELD_IDS[field]}`)?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const springYear = Number(form.springYear);
    const springAge = Number(form.springAge);

    if (!name) {
      fail('name', '이름을 입력해 주세요.');
      return;
    }
    if (form.springYear.trim() === '') {
      fail('springYear', '생년을 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(springYear)) {
      fail('springYear', '생년은 정수로 입력해 주세요.');
      return;
    }
    if (form.springAge.trim() === '') {
      fail('springAge', '입춘나이를 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(springAge)) {
      fail('springAge', '입춘나이는 정수로 입력해 주세요.');
      return;
    }

    setError(null);
    onSubmit({ name, springYear, springAge });
  };

  const invalid = (field: FieldKey) => error?.field === field;
  const typedYear = Number(form.springYear);
  const ganji =
    form.springYear.trim() !== '' && Number.isInteger(typedYear) && typedYear >= 1000 && typedYear <= 2999
      ? yearGanji(typedYear)
      : null;

  return (
    <form ref={formRef} className="intake-form" onSubmit={handleSubmit} noValidate>
      <div className="intake-rows">
        <div className={`intake-row${invalid('name') ? ' is-invalid' : ''}`}>
          <label htmlFor={FIELD_IDS.name}>
            이름
          </label>
          <div className="intake-input">
            <input
              id={FIELD_IDS.name}
              name="name"
              type="text"
              value={form.name}
              maxLength={40}
              autoComplete="off"
              autoFocus
              placeholder="홍길동"
              aria-invalid={invalid('name')}
              aria-describedby={invalid('name') ? 'form-error' : undefined}
              onChange={(event) => update('name', event.target.value)}
            />
          </div>
        </div>

        <div className={`intake-row${invalid('springYear') ? ' is-invalid' : ''}`}>
          <label htmlFor={FIELD_IDS.springYear}>
            생년
          </label>
          <div className="intake-field">
            <div className="intake-input intake-input-number">
              <input
                id={FIELD_IDS.springYear}
                name="springYear"
                type="number"
                step="1"
                inputMode="numeric"
                value={form.springYear}
                placeholder="1975"
                aria-invalid={invalid('springYear')}
                aria-describedby={invalid('springYear') ? 'form-error' : undefined}
                onChange={(event) => update('springYear', event.target.value)}
              />
              <span className="unit" aria-hidden="true">년</span>
            </div>
            <p className="intake-ganji" aria-live="polite">
              {ganji && (
                <>
                  <span className="intake-ganji-hanja">{ganji.hanja}年</span>
                  {ganji.hangul}년
                </>
              )}
            </p>
          </div>
        </div>

        <div className={`intake-row${invalid('springAge') ? ' is-invalid' : ''}`}>
          <label htmlFor={FIELD_IDS.springAge}>
            입춘나이
          </label>
          <div className="intake-input intake-input-number">
            <input
              id={FIELD_IDS.springAge}
              name="springAge"
              type="number"
              step="1"
              inputMode="numeric"
              value={form.springAge}
              placeholder="1"
              aria-invalid={invalid('springAge')}
              aria-describedby={invalid('springAge') ? 'form-error' : undefined}
              onChange={(event) => update('springAge', event.target.value)}
            />
            <span className="unit" aria-hidden="true">세</span>
          </div>
        </div>
      </div>

      <div className="intake-footer">
        <p id="form-error" className="form-message" role="alert" aria-live="polite">
          {error ? (
            <>
              <CircleAlert aria-hidden="true" size={15} />
              {error.message}
            </>
          ) : (
            <span className="form-hint">
              <kbd>
                <CornerDownLeft aria-hidden="true" size={12} />
                Enter
              </kbd>
              로 바로 분석할 수 있습니다
            </span>
          )}
        </p>
        <button className="button button-primary button-large" type="submit">
          {isEditing ? '다시 분석' : '분석하기'}
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </form>
  );
}
