export type {
  LiuNianInfo as LiunianData,
  ZiweiChart,
  ZiweiPalace,
  ZiweiStar,
} from "@orrery/core/types";

export interface DaxianItem {
  ageStart: number;
  ageEnd: number;
}

export interface ResultInterpretation {
  primaryStars: string[];
  borrowed: boolean;
  coreTrait: string;
}

export interface ResultParams {
  date: string;
  time: string;
  gender: string;
  location: string;
}
