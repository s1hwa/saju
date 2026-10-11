import { BRAND_NAME, PROGRAM_NAME } from '../constants/config';
import { LogoMark } from './LogoMark';

/** 상호와 로고를 교체할 때 이 컴포넌트와 constants/logo.ts만 바꾸면 된다. */
export function Brand() {
  return (
    <>
      <div className="brand">
        <LogoMark className="brand-mark" detail="simple" />
        <span className="brand-program">{PROGRAM_NAME}</span>
      </div>
      {/* 상호는 상단 바 가운데에 고객 이름과 같은 크기로 둔다. */}
      <span className="app-bar-brand-name">{BRAND_NAME}</span>
    </>
  );
}
