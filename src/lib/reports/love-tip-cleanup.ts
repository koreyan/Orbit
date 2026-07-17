import { stripLoveTipSection } from "./report-markdown";

export interface LoveTipCleanupReportRow {
  id: string;
  order_id: string;
  status: string | null;
  generated_at: string | null;
  content: unknown;
}

export interface LoveTipCleanupTarget {
  reportId: string;
  orderId: string;
  status: string | null;
  generatedAt: string | null;
  originalContent: Record<string, unknown>;
  nextContent: Record<string, unknown>;
  removedHeading: string;
  beforeLength: number;
  afterLength: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const findLoveTipHeading = (markdown: string): string => {
  return markdown.split("\n").find((line) => /^#{1,6}\s*5-2\s*\.?\s*연애\s*팁/i.test(line.trim()))?.trim() ?? "";
};

export const buildLoveTipCleanupTargets = (rows: LoveTipCleanupReportRow[]): LoveTipCleanupTarget[] => {
  return rows.flatMap((row) => {
    if (!isRecord(row.content) || typeof row.content.markdown !== "string") return [];

    const stripped = stripLoveTipSection(row.content.markdown);
    if (!stripped.removed || stripped.markdown === row.content.markdown) return [];

    return [{
      reportId: row.id,
      orderId: row.order_id,
      status: row.status,
      generatedAt: row.generated_at,
      originalContent: row.content,
      nextContent: {
        ...row.content,
        markdown: stripped.markdown,
      },
      removedHeading: findLoveTipHeading(row.content.markdown),
      beforeLength: row.content.markdown.length,
      afterLength: stripped.markdown.length,
    }];
  });
};
