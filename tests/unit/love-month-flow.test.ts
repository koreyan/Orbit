import { describe, expect, it } from "vitest";

import { getCurrentKoreanMonth, getMonthlyFlowMonths } from "../../src/lib/report-prompts/love-month-flow";

describe("연애 올해운 월별 범위", () => {
  it("한국 시간 기준 현재 월을 포함해 12월까지 반환한다", () => {
    const months = getMonthlyFlowMonths({
      now: new Date("2026-07-17T02:00:00.000Z"),
      liuyue: Array.from({ length: 12 }, (_, index) => ({ month: index + 1 })),
    });

    expect(months.map((item) => item.month)).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it("UTC로는 전월이어도 한국 시간이 다음 달이면 한국 월을 기준으로 한다", () => {
    expect(getCurrentKoreanMonth(new Date("2026-07-31T15:10:00.000Z"))).toBe(8);
  });

  it("현재 월 데이터가 있으면 다음 달부터 시작하지 않는다", () => {
    const months = getMonthlyFlowMonths({
      currentMonth: 7,
      liuyue: [{ month: 6 }, { month: 7 }, { month: 8 }],
    });

    expect(months.map((item) => item.month)).toEqual([7, 8]);
  });
});
