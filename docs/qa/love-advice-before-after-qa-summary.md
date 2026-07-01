# Love Advice Pipeline QA Summary

## 1. 대상 샘플

| 샘플 | 조건 | QA 리포트 | 원본 JSON |
|---|---|---|---|
| Sample 01 | 1990-01-01 12:00 M / E2E love dummy chart | `docs/qa/love-advice-before-after-qa-sample-01.md` | `docs/qa/love-advice-before-after-sample-01.json` |
| Sample 02 | 1994-05-17 21:30 F / attraction-risk sample | `docs/qa/love-advice-before-after-qa-sample-02.md` | `docs/qa/love-advice-before-after-sample-02.json` |
| Sample 03 | 1988-11-03 08:15 M / boundary-action sample | `docs/qa/love-advice-before-after-qa-sample-03.md` | `docs/qa/love-advice-before-after-sample-03.json` |

## 2. 정량 요약

| 샘플 | 내부 용어 노출 Before | 내부 용어 노출 After | 실행 행동 신호 Before | 실행 행동 신호 After | 판정 |
|---|---:|---:|---:|---:|---|
| Sample 01 | 25 | 0 | 5 | 7 | 개선됨 |
| Sample 02 | 19 | 0 | 5 | 6 | 개선됨 |
| Sample 03 | 24 | 0 | 5 | 9 | 개선됨 |
| 합계 | 68 | 0 | 15 | 22 | 개선됨 |

## 3. 기준별 종합 판정

| 항목 | 판정 | 근거 |
|---|---|---|
| 해석 가이드 준수 | 통과 | 3개 샘플 모두 기존 love guide의 1, 2, 6번 섹션 흐름을 유지한다. |
| 문제점 선명도 | 개선됨 | 조건-감정 불일치, 신뢰 형성, 감정 확인 루프, 관계 기준 정리가 더 분명해졌다. |
| 조언 실용성 | 개선됨 | 실행 행동 신호가 15 → 22로 증가했다. |
| 과잉 조언 방지 | 통과 | 섹션 1, 2는 해석 중심이고 섹션 6에 실행 조언이 집중된다. |
| 섹션별 rule 제한 | 통과 | 3개 샘플에서 조언 과밀 현상 없음. |
| 금지 프레임 | 통과 | 성별 본질론, 정복/소유/밀당/조종/서열화 표현 없음. |
| 자미두수 용어 노출 | 통과 | After 3개 샘플 모두 내부 용어 0건. |
| rule 노출 방지 | 통과 | 내부 rule/source 식별자 노출 없음. |

## 4. 최종 판단

현재 rule 제한값을 유지한다.

```text
- 섹션 1~5: 최대 2개
- 섹션 6: 최대 3개
- 전체: 최대 6개
```

이유:

```text
- Sample 01~03 모두 Before 대비 After 품질이 개선됐다.
- 내부 용어 노출은 68건 → 0건으로 줄었다.
- 실행 행동 신호는 15건 → 22건으로 증가했다.
- 조언이 과밀하거나 조언서처럼 변하는 현상은 확인되지 않았다.
```

## 5. 반영된 추가 조치

| 조치 | 파일 |
|---|---|
| love 전용 최종 출력 용어 변환 규칙 추가 | `src/lib/report-prompts/love-system-prompt.ts` |
| 용어 변환 규칙 E2E assertion 추가 | `tests/e2e/backend-report-prompt.spec.ts` |
| QA 기준 문서에 Sample 01~03 산출물 연결 | `docs/love-advice-pipeline-qa.md` |
