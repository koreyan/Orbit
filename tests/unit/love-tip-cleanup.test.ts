import { describe, expect, it } from "vitest";

import { buildLoveTipCleanupTargets } from "../../src/lib/reports/love-tip-cleanup";

describe("연애 팁 DB 정리 대상 생성", () => {
  it("5-2 연애 팁이 있는 love report content만 backup/update 대상으로 만든다", () => {
    const targets = buildLoveTipCleanupTargets([
      {
        id: "report-1",
        order_id: "order-1",
        status: "completed",
        generated_at: "2026-07-17T00:00:00Z",
        content: {
          markdown: "## 5-1. 올해 연애운\n유지\n\n### 5-2. 연애 팁 (개운 처방전)\n삭제",
          other: "keep",
        },
      },
      {
        id: "report-2",
        order_id: "order-2",
        status: "completed",
        generated_at: null,
        content: { markdown: "## 5. 앞으로 다가올 연애 기회\n유지" },
      },
    ]);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({
      reportId: "report-1",
      orderId: "order-1",
      removedHeading: "### 5-2. 연애 팁 (개운 처방전)",
    });
    expect(targets[0].nextContent).toEqual({
      markdown: "## 5-1. 올해 연애운\n유지",
      other: "keep",
    });
  });

  it("markdown이 없는 content는 건너뛴다", () => {
    expect(buildLoveTipCleanupTargets([{ id: "r", order_id: "o", status: null, generated_at: null, content: {} }])).toEqual([]);
  });
});
