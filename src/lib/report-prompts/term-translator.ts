/**
 * 자미두수 전문용어 → 일반인 친화 표현 치환 모듈
 * "병기" 스타일: "별칭(원래이름)" 형태로 출력
 * 연애 테마 전용
 */

/** 궁위 별칭 매핑 */
const PALACE_ALIASES: Record<string, string> = {
  "명궁": "타고난 성격의 자리",
  "형제궁": "형제의 자리",
  "부처궁": "연애와 결혼의 자리",
  "자녀궁": "본능과 스킨십의 자리",
  "재백궁": "재물의 자리",
  "질액궁": "건강의 자리",
  "천이궁": "대외적 이미지의 자리",
  "노복궁": "친구와 인맥의 자리",
  "관록궁": "일과 커리어의 자리",
  "전택궁": "가정의 자리",
  "복덕궁": "마음의 안식처",
  "부모궁": "부모의 자리",
};

/** 주성 별칭 매핑 */
const STAR_ALIASES: Record<string, string> = {
  "자미": "기품의 별",
  "천기": "지성의 별",
  "태양": "헌신의 별",
  "무곡": "신뢰의 별",
  "천동": "순수의 별",
  "염정": "세련된 매력의 별",
  "천부": "포용의 별",
  "태음": "감성의 별",
  "탐랑": "다채로운 욕망의 별",
  "거문": "분석의 별",
  "천상": "조화의 별",
  "천량": "지혜의 별",
  "칠살": "돌파의 별",
  "파군": "개척의 별",
};

/** 사화 별칭 매핑 */
const SIHUA_ALIASES: Record<string, string> = {
  "화록": "번창의 기운",
  "화권": "권력의 기운",
  "화과": "명예의 기운",
  "화기": "장애의 기운",
};

/** 카테고리 용어 별칭 매핑 */
const CATEGORY_ALIASES: Record<string, string> = {
  "주성": "중심의 별",
  "길성": "도움의 별",
  "살성": "시련의 별",
  "도화성": "매력의 별",
};

/** 궁위명 → "별칭(원래이름)" 형태로 치환 */
export const translatePalace = (name: string): string => {
  const alias = PALACE_ALIASES[name];
  return alias ? `${alias}(${name})` : name;
};

/** 별 이름 → "별칭(원래이름)" 형태로 치환 (주성만 대상) */
export const translateStar = (name: string): string => {
  const alias = STAR_ALIASES[name];
  return alias ? `${alias}(${name})` : name;
};

/** 사화명 → "별칭(원래이름)" 형태로 치환 */
export const translateSihua = (sihua: string): string => {
  const alias = SIHUA_ALIASES[sihua];
  return alias ? `${alias}(${sihua})` : sihua;
};

/** 카테고리 라벨 → 치환 */
export const translateCategory = (term: string): string =>
  CATEGORY_ALIASES[term] ?? term;

/**
 * 별 이름 + 사화를 결합하여 치환된 문자열 반환
 * 예: ("염정", "화권") → "세련된 매력의 별(염정) + 권력의 기운(화권)"
 * 예: ("염정", null) → "세련된 매력의 별(염정)"
 */
export const translateStarWithSihua = (
  name: string,
  sihua: string | null | undefined,
): string => {
  const translatedStar = translateStar(name);
  if (!sihua) return translatedStar;
  const translatedSihua = translateSihua(sihua);
  return `${translatedStar} + ${translatedSihua}`;
};

/**
 * LLM 출력(마크다운) 후처리:
 * 이미 "별칭(원래이름)" 형태인 것은 보존하고,
 * 누출된 bare 전문용어만 "별칭(원래이름)" 형태로 치환
 */
export const sanitizeTerminology = (text: string): string => {
  if (!text) return text;

  // 1. 이미 "별칭(원래이름)"으로 치환된 패턴들을 보호하기 위해 플레이스홀더로 임시 변환
  let result = text;
  
  const allEntries: [string, string][] = [
    ...Object.entries(PALACE_ALIASES),
    ...Object.entries(STAR_ALIASES),
    ...Object.entries(SIHUA_ALIASES),
  ].sort((a, b) => b[0].length - a[0].length);

  const placeholders: Map<string, string> = new Map();
  let placeholderCount = 0;

  for (const [term, alias] of allEntries) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // "별칭(용어)" 패턴 찾기
    const pattern = new RegExp(`${escapedAlias}\\(${escapedTerm}\\)`, "g");
    if (pattern.test(result)) {
      const placeholder = `\x00PLACEHOLDER_${placeholderCount++}\x00`;
      placeholders.set(placeholder, `${alias}(${term})`);
      result = result.replace(pattern, placeholder);
    }
  }

  // 2. 남은 bare 전문용어들을 단일 패스로 치환
  const termPattern = new RegExp(`(${allEntries.map(e => e[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join('|')})(성)?`, 'g');
  
  result = result.replace(termPattern, (match, term) => {
    const palaceAlias = PALACE_ALIASES[term];
    if (palaceAlias) return `${palaceAlias}(${term})`;

    const starAlias = STAR_ALIASES[term];
    if (starAlias) return `${starAlias}(${term})`;

    const sihuaAlias = SIHUA_ALIASES[term];
    if (sihuaAlias) return `${sihuaAlias}(${term})`;

    return match;
  });

  // 3. 플레이스홀더 복원
  for (const [placeholder, original] of placeholders.entries()) {
    result = result.replaceAll(placeholder, original);
  }

  return result;
};
