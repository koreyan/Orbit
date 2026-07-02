export type LoveEvidenceTag =
  | "attraction_pattern"
  | "compatible_partner"
  | "conflict_pattern"
  | "solo_blocker"
  | "charm_asset"
  | "encounter_path"
  | "timing_signal"
  | "action_guide";

export type LovePalaceRole =
  | "life"
  | "spouse"
  | "fortune"
  | "children"
  | "migration"
  | "career"
  | "friends"
  | "parents"
  | "siblings"
  | "timing";

export interface LoveStarSignal {
  name: string;
  sihua: string | null;
}

export interface LovePalaceSnapshot {
  label: string;
  role: LovePalaceRole;
  majorStars: LoveStarSignal[];
  luckyStars: LoveStarSignal[];
  unluckyStars: LoveStarSignal[];
  borrowed?: boolean;
}

export interface LoveKnowledgeEntry {
  core_trait?: string;
  love_insight?: string;
}

export type LoveKnowledgeBase = Record<string, LoveKnowledgeEntry>;
