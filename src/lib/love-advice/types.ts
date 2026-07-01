export type LoveAdviceAxisName =
  | "솔로 패턴 교정"
  | "끌림-적합 판별"
  | "실행 준비"
  | "자기인식"
  | "매력 운용"
  | "인연 유입 행동"
  | "타이밍 대응";

export type LoveReportSectionId = 1 | 2 | 3 | 4 | 5 | 6;

export type LoveRiskType =
  | "projection"
  | "fantasy_idealization"
  | "confirmation_seeking"
  | "contact_anxiety"
  | "pace_control"
  | "overcentering_love"
  | "boundary_failure"
  | "loneliness_based_choice"
  | "post_breakup_idealization"
  | "approach_avoidance"
  | "words_over_actions"
  | "public_contempt"
  | "ideal_type_confusion"
  | "condition_overload"
  | "unstable_attraction"
  | "conflict_expression"
  | "self_routine"
  | "encounter_action"
  | "timing_response"
  | "charm_operation";

export interface LoveAdviceRule {
  ruleId: string;
  axisMain: boolean;
  axisName: LoveAdviceAxisName;
  obitSections: LoveReportSectionId[];
  sourceBook: string;
  sourceExcerpt: string;
  triggerPattern: string;
  riskExpression: string;
  adviceDirection: string;
  actionExample: string;
  forbiddenFrame: string;
  notes: string;
  matchTags: LoveRiskType[];
  priority: number;
}

export interface MatchedLoveAdviceRule {
  rule: LoveAdviceRule;
  matchedRiskTypes: LoveRiskType[];
  matchedSections: LoveReportSectionId[];
}
