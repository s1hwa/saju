import { logoSvg, type LogoDetail } from '../constants/logo';

interface LogoMarkProps {
  detail: LogoDetail;
  /** 100 단위 기준 테두리 두께 */
  border?: number;
  className?: string;
}

/** 크기는 className의 CSS가 정한다. 도형은 고정된 내부 상수라 innerHTML로 넣어도 안전하다. */
export function LogoMark({ detail, border, className }: LogoMarkProps) {
  return (
    <span
      className={`logo-mark${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: logoSvg(detail, border) }}
    />
  );
}
