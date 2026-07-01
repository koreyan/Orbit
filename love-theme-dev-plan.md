# 연애 테마 시스템 프롬프트 개발 PLAN

> 작성일: 2026-06-28
> 작성자: Sophie (총무/비서)
> 대상: Obit 개발자 (obit profile)

---

## 1. 목표

현재 `report.ts`의 연애/매력 프롬프트(407~451행)를 아래 기준에 맞게 개선한다.

- **솔로 타겟**으로 명확하게 재포지셔닝
- **데이터 정규화 8개 태그**를 프롬프트에 반영
- **star + palace + formation** 3소스 데이터를 모두 활용
- 전문 용어 100% 배제, 일상어로만 표현

---

## 2. 현재 상태 분석

### 2.1 현재 연애 프롬프트 구조 (report.ts 407~451행)

현재 출력 목차 (7장):
1. 내가 마음속으로 갈망하는 이성의 모습
2. 내가 만나야 진정으로 행복해지는 이성의 성향
3. 나만의 이성적 매력 자산 및 개발법
4. 내가 경계해야 할 연애 약점과 조언
5. 앞으로 5년간의 연애 흐름 요약
6. (생략됨 — 데이터 정규화 미반영)
7. 지금 당장 내가 시작해야 할 준비

### 2.2 문제점

| 문제 | 상세 |
|------|------|
| 목차 7장 중 일부 누락 | 7개 목차가 아닌 5~6개만 구현 |
| star 편중 | palace(부처궁, 자녀궁, 천이궁) 데이터를 프롬프트에서 미활용 |
| formation 미사용 | 도화, 함지, 천희 등 특수 구조 데이터 프롬프트 미반영 |
| 솔로 타겟 불명확 | "연애 중 사용자"와 "솔로 사용자" 경계 모호 |
| 8개 태그 미매핑 | attraction_pattern, solo_blocker 등 분류 태그가 프롬프트에 없음 |

---

## 3. 개발 작업 목록

### Phase 1: 데이터 준비 (DB + 코드)

#### 1-1. `z_knowledge_base` 테이블 데이터 정규화

```sql
-- love_insight 데이터에 분류 태그 부여 (메타데이터 컬럼 추가 또는 별도 매핑 테이블)
-- 기존 데이터를 훼손하지 않고, 조회 목적별로 태그를 매핑하는 방식

-- 방법 A: 태그 매핑 테이블 생성 (권장)
CREATE TABLE z_love_tag_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid REFERENCES z_knowledge_base(id),
  tag varchar(50) NOT NULL,  -- attraction_pattern, compatible_partner, conflict_pattern, solo_blocker, charm_asset, encounter_path, timing_signal, action_guide
  created_at timestamptz DEFAULT now()
);

-- 방법 B: love_insight 텍스트 내 태그 패턴 추출 (간이)
-- AI가 리포트 생성 시 love_insight 텍스트를 파싱하여 태그를 자동 분류
```

**우선 방법 A를 사용한다.** 이유: 데이터 재사용성과 프롬프트 제어력이 높다.

#### 1-2. 태그 기준 데이터 매핑

| 태그 | 데이터 소스 | 매핑 기준 |
|------|------------|-----------|
| `attraction_pattern` | star (명궁 주성) + 자녀궁 | 이상형 성향, 끌리는 패턴 |
| `compatible_partner` | palace (부처궁) | 실제 관계 적합성, 안정감 |
| `conflict_pattern` | palace (부처궁 사화/살성) | 갈등 반복 패턴 |
| `solo_blocker` | star (명궁 특수성) + palace (신궁) | 연애 진입 장벽 |
| `charm_asset` | star (명궁) + palace (자녀궁) + formation (도화) | 외적·내적 매력 |
| `encounter_path` | palace (천이궁) | 인연 유입 경로 |
| `timing_signal` | periodic_insight + 유년 흐름 | 인연 시기, 감정 기복 |
| `action_guide` | 종합 판단 | 지금 당장 행동 지침 |

#### 1-3. `ziwei-extractor.ts` 확장

```typescript
// 새 함수 추출
export function extractLoveTags(extractedStars: ExtractedStars, chartData: ZiweiChart): LoveTagData {
  return {
    attraction_pattern: extractAttractionPattern(extractedStars, chartData),
    compatible_partner: extractCompatiblePartner(extractedStars, chartData),
    conflict_pattern: extractConflictPattern(extractedStars, chartData),
    solo_blocker: extractSoloBlocker(extractedStars, chartData),
    charm_asset: extractCharmAsset(extractedStars, chartData),
    encounter_path: extractEncounterPath(extractedStars, chartData),
    timing_signal: extractTimingSignal(extractedStars, chartData),
    action_guide: extractActionGuide(extractedStars, chartData),
  }
}
```

---

### Phase 2: 프롬프트 재작성

#### 2-1. 새 리포트 목차 (7장, 태그 1:1 매핑)

| 장 | 제목 | 태그 | 데이터 소스 |
|----|------|------|------------|
| 1 | 왜 아직 연애가 잘 안 풀리는가 | solo_blocker + conflict_pattern | star(명궁) + palace(부처궁, 신궁) |
| 2 | 내가 끌리는 사람 vs 실제로 잘 맞는 사람 | attraction_pattern + compatible_partner | star(명궁) + palace(부처궁, 자녀궁) |
| 3 | 나의 연애 매력 자산 | charm_asset | star(명궁) + palace(자녀궁) + formation(도화) |
| 4 | 인연이 들어오기 쉬운 방식 | encounter_path | palace(천이궁) |
| 5 | 내가 경계해야 할 솔로 패턴 | solo_blocker + conflict_pattern | star(명궁 특수성) + palace(부처궁) |
| 6 | 앞으로 5년 인연 흐름 | timing_signal | periodic_insight + 유년 흐름 |
| 7 | 지금 당장 해야 할 연애 준비 | action_guide | 종합 |

#### 2-2. 프롬프트 구조 변경

**기존 (report.ts 407~451행):**
```
- 내가 마음속으로 갈망하는 이성의 모습
- 내가 만나야 진정으로 행복해지는 이성의 성향
- 나만의 이성적 매력 자산 및 개발법
- 내가 경계해야 할 연애 약점과 조언
- 앞으로 5년간의 연애 흐름 요약
- 지금 당장 내가 시작해야 할 준비
```

**변경 후:**
```
- 1. 왜 아직 연애가 잘 안 풀리는가 (solo_blocker 중심)
- 2. 내가 끌리는 사람 vs 실제로 잘 맞는 사람 (attraction_pattern + compatible_partner)
- 3. 나의 연애 매력 자산 (charm_asset)
- 4. 인연이 들어오기 쉬운 방식 (encounter_path)
- 5. 내가 경계해야 할 솔로 패턴 (solo_blocker + conflict_pattern)
- 6. 앞으로 5년 인연 흐름 (timing_signal)
- 7. 지금 당장 해야 할 연애 준비 (action_guide)
```

#### 2-3. 데이터 주입 방식 변경

```typescript
// 기존: 부처궁 주성만 사용
const themePrompt = `...부처궁 주성 [데이터]...`;

// 변경: 태그별 데이터 주입
const themePrompt = `
[attraction_pattern 데이터: ${loveTagData.attraction_pattern}]
[compatible_partner 데이터: ${loveTagData.compatible_partner}]
[conflict_pattern 데이터: ${loveTagData.conflict_pattern}]
[solo_blocker 데이터: ${loveTagData.solo_blocker}]
[charm_asset 데이터: ${loveTagData.charm_asset}]
[encounter_path 데이터: ${loveTagData.encounter_path}]
[timing_signal 데이터: ${loveTagData.timing_signal}]
[action_guide 데이터: ${loveTagData.action_guide}]
`;
```

---

### Phase 3: 코드 수정 상세

#### 3-1. `src/app/actions/report.ts` 수정

**대상 라인:** 407~451행 (연애/매력 프롬프트 블록)

```typescript
// Before: 기존 연애 프롬프트 (407~451행)
// After: 7개 목차 + 태그 기반 프롬프트로 전면 재작성
```

**추가 수정:**
- `generateReportAction` 내 `theme === 'love'` 분기 로직에 `extractLoveTags()` 호출 추가
- `filterThemePalaces` 결과에 palace + formation 데이터 포함하도록 확장

#### 3-2. `src/lib/ziwei-extractor.ts` 수정

```typescript
// 새 타입 추가
export interface LoveTagData {
  attraction_pattern: string
  compatible_partner: string
  conflict_pattern: string
  solo_blocker: string
  charm_asset: string
  encounter_path: string
  timing_signal: string
  action_guide: string
}

// 새 함수 추가
export function extractLoveTags(
  extractedStars: ExtractedStars,
  chartData: ZiweiChart,
  loveKnowledgeBase: KnowledgeBaseEntry[]
): LoveTagData { ... }
```

#### 3-3. `src/lib/knowledge-base.ts` 수정

```typescript
// love 테마 조회 시 palace + formation 데이터도 함께 조회
export async function fetchLoveKnowledgeBase(
  stars: string[],
  palaces: string[],
  formations: string[]
): Promise<KnowledgeBaseEntry[]> { ... }
```

---

### Phase 4: 검증

#### 4-1. 데이터 검증
- `z_knowledge_base`에서 love_insight 데이터가 8개 태그에 올바르게 매핑되었는지 확인
- 샘플 5개 사주로 태그 추출 테스트

#### 4-2. 프롬프트 검증
- 생성된 리포트에서 전문 용어(명궁, 부처궁, 사화 등)가 0건인지 확인
- 7개 목차가 모두 채워지는지 확인
- 솔로 타겟 문장이 정확한지 확인 (연애 중 사용자 문장 없는지)

#### 4-3. 빌드 검증
```bash
cd /Users/white/Desktop/Obit
npm run lint
npm run build
```

---

## 4. 작업 우선순위

| 순서 | 작업 | 예상 소요 | 의존성 |
|------|------|-----------|--------|
| 1 | `z_love_tag_mapping` 테이블 생성 + 데이터 매핑 | 1h | 없음 |
| 2 | `ziwei-extractor.ts` `extractLoveTags()` 구현 | 2h | #1 |
| 3 | `knowledge-base.ts` love 조회 확장 | 1h | #1 |
| 4 | `report.ts` 연애 프롬프트 7장 재작성 | 3h | #2, #3 |
| 5 | 샘플 리포트 생성 테스트 | 1h | #4 |
| 6 | lint + build 검증 | 30m | #5 |

---

## 5. 주의사항

1. **기존 데이터 훼손 금지** — `z_knowledge_base` 원본은 읽기 전용, 태그 매핑만 추가
2. **전문 용어 배제** — 프롬프트 내 명리학 용어 0개 (위반 시 리포트 재생성)
3. **솔로 타겟 명확화** — "연애 중", "상대방과" 같은 문장 절대 불가 → "지금은 연애를 시작하기 전", "인연이 들어왔을 때" 등으로 표현
4. **formation 데이터** — 도화, 함지, 천희가 있을 때만 해당 섹션에 반영 (조건부 렌더링)
5. **역호환성** — 커리어/여가 테마는 기존 로직 유지, 연애 테마만 변경

---

## 6. 참고 자료

- Apple Notes: "Obit 연애 테마 데이터 정규화 전략"
- Apple Notes: "Todo System Prompting"
- 코드: `src/app/actions/report.ts` 407~451행 (기존 연애 프롬프트)
- 코드: `src/lib/ziwei-extractor.ts` (궁 필터링 로직)
