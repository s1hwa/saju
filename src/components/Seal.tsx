import { yearGanji } from '../constants/hanja';

interface SealProps {
  year: number;
  className?: string;
}

/** 입춘 기준 연도의 간지를 인주 낙관처럼 찍는다. 예: 乙亥年生 */
export function Seal({ year, className }: SealProps) {
  const { hanja, hangul } = yearGanji(year);
  return (
    <div className={`seal${className ? ` ${className}` : ''}`} role="img" aria-label={`${hangul}년생`}>
      <span>{hanja[0]}</span>
      <span>{hanja[1]}</span>
      <span>年</span>
      <span>生</span>
    </div>
  );
}
