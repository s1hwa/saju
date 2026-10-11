import { LoaderCircle, Printer } from 'lucide-react';

interface ResultActionsProps {
  busy: boolean;
  onPrint: () => void;
}

export function ResultActions({ busy, onPrint }: ResultActionsProps) {
  return (
    <button
      className="button button-outline"
      type="button"
      onClick={onPrint}
      disabled={busy}
      aria-busy={busy}
      title="A4 결과지 인쇄"
    >
      {busy ? (
        <LoaderCircle className="spin" aria-hidden="true" size={15} />
      ) : (
        <Printer aria-hidden="true" size={15} />
      )}
      인쇄
    </button>
  );
}
