import type { MatchedLoveAdviceRule } from "./types";

export const formatLoveAdviceContext = (matches: MatchedLoveAdviceRule[]): string => {
  if (matches.length === 0) {
    return "[LOVE_ADVICE_RULES]\n- 매칭된 조언 rule 없음";
  }

  return `
[LOVE_ADVICE_RULES]
- 역할: 아래 rule은 자미두수 해석을 새로 만들지 않고, 이미 도출된 문제점에 대한 행동 조언으로만 사용한다.
- 제한: 섹션 1~5는 최대 2개, 섹션 6은 최대 3개, 전체 최대 6개 rule만 사용한다.
- 출력 금지: 최종 리포트에는 내부 rule 식별자와 출처 정보를 노출하지 않는다.
${matches.map((match, index) => `${index + 1}. ${match.rule.ruleId} / ${match.rule.axisName}
   - 연결 리스크: ${match.matchedRiskTypes.join(", ")}
   - 연결 섹션: ${match.matchedSections.join(", ")}
   - 조언 방향: ${match.rule.adviceDirection}
   - 실행 예시: ${match.rule.actionExample}
   - 금지 프레임: ${match.rule.forbiddenFrame}`).join("\n")}
`;
};
