export function formatFlowValue(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}`;
}

export function formatConsultationDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
