export type LoveEvidenceTag =
  | "attraction_pattern"
  | "compatible_partner"
  | "conflict_pattern"
  | "solo_blocker"
  | "charm_asset"
  | "encounter_path"
  | "timing_signal"
  | "action_guide";

export interface LoveSectionEvidence {
  section: string;
  primaryPalaces: string[];
  directEvidenceLimit: number;
  requiredTags: LoveEvidenceTag[];
  writingInstruction: string;
}
