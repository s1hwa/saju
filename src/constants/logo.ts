/**
 * 선행원 로고(A안): 둥근 사각 올리브 배지 안의 얼굴 캐리커처.
 * 화면 로고(LogoMark)와 실행 아이콘(scripts/render-icon.cjs)이 모두 이 도형을 쓴다.
 * 좌표는 의뢰인 원본 그림에서 비율을 따왔다. 가로가 넓고 턱이 묵직한 얼굴, 기울어진 사각 안경, 올라간 입꼬리.
 */

export type LogoDetail = 'full' | 'simple' | 'small' | 'tiny';

export const LOGO_COLORS = {
  olive: '#b4b27c',
  ink: '#1f1b16',
  face: '#fbf6ea',
  shade: '#c5ccd1',
} as const;

const { olive, ink, face, shade } = LOGO_COLORS;

const HEAD =
  'M47 11 C64 11 80 20 89 35 C95 46 98 60 98 72 C98 84 92 88 80 89.5 C68 90.5 32 90.5 20 89 C8 87.5 3.5 80 3.5 70 C3.5 52 8 38 17 26 C25 16 35 11 47 11 Z';
const MOUTH = 'M38.5 72.6 Q41 75.6 46 75.8 Q55 76 59.5 73.6 Q61.5 72.4 62.8 70.6';
const TILT = 'rotate(-7 51 43)';

const ears = `<ellipse cx="3.5" cy="50" rx="5.5" ry="12" fill="${shade}"/><ellipse cx="94" cy="43" rx="6" ry="11.5" fill="${shade}"/>`;
const head = (width: number) => `<path d="${HEAD}" fill="${face}" stroke="${ink}" stroke-width="${width}"/>`;
const lenses = (width: number) =>
  `<rect x="18.5" y="34" width="29" height="19" rx="4" transform="${TILT}" fill="none" stroke="${ink}" stroke-width="${width}"/>` +
  `<rect x="54.5" y="34" width="29" height="19" rx="4" transform="${TILT}" fill="none" stroke="${ink}" stroke-width="${width}"/>`;
// 작은 크기용 코: 원본의 넓은 뭉툭코를 회색 음영과 굵은 양옆 선으로 줄였다.
const noseShade = `<path d="M40 59.5 Q52 57 64 58.5 Q61 64.5 54 65 Q51 69 47.5 65 Q42 64 40 59.5 Z" fill="${shade}"/>`;
const noseSides = (width: number) =>
  `<path d="M41.5 53.5 Q36.5 58.5 40 62 M62 50.5 Q66 56 63 60.5" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round"/>`;
// 안경 안의 눈동자. 작은 크기일수록 크게 찍어야 점이 남는다.
const eyes = (rx: number, ry: number) =>
  `<ellipse cx="40" cy="45.2" rx="${rx}" ry="${ry}" fill="${ink}"/><ellipse cx="63" cy="42.6" rx="${rx}" ry="${ry}" fill="${ink}"/>`;
const mouth = (width: number) =>
  `<path d="${MOUTH}" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round"/>`;

const FACES: Record<LogoDetail, string> = {
  full:
    ears +
    head(2.6) +
    lenses(3) +
    `<path d="M47.5 43.4 Q51 40.5 54.5 42.6" fill="none" stroke="${ink}" stroke-width="2.4"/>` +
    `<ellipse cx="40" cy="45.2" rx="2.6" ry="3.6" fill="${ink}"/><ellipse cx="63" cy="42.6" rx="2.6" ry="3.6" fill="${ink}"/>` +
    `<path d="M41 60 Q52 58 63 59 Q60 63 54 63.5 Q51 67 48 63.5 Q43 63 41 60 Z" fill="${shade}"/>` +
    `<path d="M41.5 54.5 Q37 58 39.5 61 Q41 62.5 43 62 M61.5 51.5 Q64.5 56 63 59.5 Q62 61 60.5 61.5" fill="none" stroke="${ink}" stroke-width="1.8"/>` +
    `<path d="M47.5 79.6 Q52 80.4 56.5 79.4" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M48.5 81.6 Q52 82.8 55.5 81.4" fill="none" stroke="${shade}" stroke-width="1.6" stroke-linecap="round"/>` +
    mouth(2.4),
  simple: ears + head(5) + lenses(5.5) + eyes(3.4, 4.6) + noseShade + noseSides(3.6) + mouth(4),
  small: head(6) + lenses(7) + eyes(4, 5) + noseShade,
  tiny: head(9) + `<rect x="14" y="37" width="72" height="14" fill="${ink}" transform="${TILT}"/>`,
};

/** 표시 크기(px)에 맞는 세부 단계. 작을수록 눈·코·입을 덜어낸다. */
export function logoDetailForSize(px: number): LogoDetail {
  if (px >= 96) return 'full';
  if (px >= 36) return 'simple';
  if (px >= 24) return 'small';
  return 'tiny';
}

/** 테두리 두께는 100 단위 기준. 작은 크기일수록 두껍게 줘야 선이 남는다. */
export function logoSvg(detail: LogoDetail, border = 4): string {
  const inset = border / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">` +
    `<rect x="${inset}" y="${inset}" width="${100 - border}" height="${100 - border}" rx="16" fill="${olive}" stroke="${ink}" stroke-width="${border}"/>` +
    `<svg x="6.5" y="6.5" width="87" height="87" viewBox="-5 -4 110 110">${FACES[detail]}</svg>` +
    `</svg>`
  );
}
