import { useState } from 'react';
import { calculateConsultation } from './logic/calculateConsultation';
import { ConsultationPage } from './pages/ConsultationPage';
import { ResultPage } from './pages/ResultPage';
import type { ConsultationInput, ConsultationResult } from './types/consultation';

type View = 'entry' | 'result';

export default function App() {
  const [view, setView] = useState<View>('entry');
  const [draft, setDraft] = useState<ConsultationInput | undefined>();
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [consultationDate, setConsultationDate] = useState(() => new Date());

  const analyze = (input: ConsultationInput) => {
    setDraft(input);
    setResult(calculateConsultation(input));
    setConsultationDate(new Date());
    setView('result');
  };

  const startNew = () => {
    setDraft(undefined);
    setResult(null);
    setView('entry');
  };

  if (view === 'result' && result) {
    return (
      <ResultPage
        result={result}
        consultationDate={consultationDate}
        onEdit={() => setView('entry')}
        onNew={startNew}
      />
    );
  }

  return (
    <ConsultationPage
      initialValue={draft}
      onSubmit={analyze}
      onCancel={result ? () => setView('result') : undefined}
    />
  );
}

