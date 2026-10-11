/** 화면 표기 전용 한자. 계산에는 쓰지 않는다. */
export const SOLAR_TERM_HANJA: Readonly<Record<string, string>> = {
  입춘: '立春',
  우수: '雨水',
  경칩: '驚蟄',
  춘분: '春分',
  청명: '淸明',
  곡우: '穀雨',
  입하: '立夏',
  소만: '小滿',
  망종: '芒種',
  하지: '夏至',
  소서: '小暑',
  대서: '大暑',
  입추: '立秋',
  처서: '處暑',
  백로: '白露',
  추분: '秋分',
  한로: '寒露',
  상강: '霜降',
  입동: '立冬',
  소설: '小雪',
  대설: '大雪',
  동지: '冬至',
  소한: '小寒',
  대한: '大寒',
};

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const STEMS_KO = '갑을병정무기경신임계';
const BRANCHES_KO = '자축인묘진사오미신유술해';

const mod = (value: number, base: number) => ((value % base) + base) % base;

export interface Ganji {
  hanja: string;
  hangul: string;
}

/** 입춘 기준 연도의 간지(예: 1995 → 乙亥 · 을해). 결과지 표기에만 쓴다. */
export function yearGanji(year: number): Ganji {
  const stem = mod(year - 4, 10);
  const branch = mod(year - 4, 12);
  return {
    hanja: STEMS[stem] + BRANCHES[branch],
    hangul: STEMS_KO[stem] + BRANCHES_KO[branch],
  };
}

export function solarTermHanja(term: string): string {
  return SOLAR_TERM_HANJA[term] ?? term;
}
