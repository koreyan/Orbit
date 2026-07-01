# Love Advice Pipeline QA

## Before / After 비교 기준

| 항목 | 통과 기준 |
|---|---|
| 해석 가이드 준수 | 명반 기질 해석은 `docs/love-reading-interpretation-guide.md` 기준만 따른다. |
| 문제점 선명도 | 섹션 1, 2, 6에서 반복 패턴/리스크가 구체적으로 보인다. |
| 조언 실용성 | 최소 2개 이상 행동 예시가 실제로 실행 가능하다. |
| 과잉 조언 방지 | 섹션 3, 4, 5가 조언서처럼 과해지지 않는다. |
| 섹션별 rule 제한 | 섹션 1~5는 최대 2개, 섹션 6은 최대 3개, 전체 최대 6개 rule만 주입된다. |
| 금지 프레임 | 성별 본질론, 정복/소유/밀당/조종/서열화가 없다. |
| 자미두수 용어 노출 | 최종 리포트에 궁/별/사화 용어가 노출되지 않는다. |
| rule 노출 방지 | 최종 리포트에 `rule_id`, `source_book`, `source_excerpt`가 나오지 않는다. |

## 검증 순서

1. E2E mock으로 `systemPrompt`와 `userContext`에 새 레이어가 들어갔는지 확인한다.
2. 실제 샘플 리포트 2~3개를 생성해 기존 결과와 비교한다.  
   - Sample 01 완료: `docs/qa/love-advice-before-after-qa-sample-01.md`
   - Sample 02 완료: `docs/qa/love-advice-before-after-qa-sample-02.md`
   - Sample 03 완료: `docs/qa/love-advice-before-after-qa-sample-03.md`
   - 종합 리포트: `docs/qa/love-advice-before-after-qa-summary.md`
3. 조언이 약하면 전체 8개까지 늘리고, 과하면 전체 4개까지 줄인다.  
   - Sample 01~03 기준 조정 불필요. 현재 전체 최대 6개 유지.
4. 섹션 6만 조언이 부족하면 섹션 6 제한만 4개로 올리는 방안을 검토한다.  
   - Sample 01~03 기준 조정 불필요. 현재 섹션 6 최대 3개 유지.

## 새 context 레이어

```text
[TRAIT_FINDINGS]
[RISK_PATTERNS]
[LOVE_ADVICE_RULES]
```

## 품질 판정

| 결과 | 조정 |
|---|---|
| 조언이 일반론처럼 느껴짐 | risk extraction 근거를 강화한다. |
| 조언이 너무 많음 | 전체 rule 수를 4개로 줄인다. |
| 리포트가 조언서처럼 변함 | 섹션 1~5 제한을 1개로 줄인다. |
| 준비 섹션이 약함 | 섹션 6 제한만 4개로 올린다. |
