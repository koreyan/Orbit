import { describe, expect, it } from "vitest";

import { assertReportGenerationUpdateApplied, buildReportFailureNotification } from "../../src/lib/reports/report-generation-result";

describe("리포트 생성 결과 처리", () => {
  it("DB update error가 있으면 성공 알림 전에 예외를 던진다", () => {
    expect(() => assertReportGenerationUpdateApplied({
      updateErrorMessage: "permission denied",
      updatedRows: null,
    })).toThrow("리포트 저장 실패: permission denied");
  });

  it("업데이트된 row가 없으면 성공 처리하지 않는다", () => {
    expect(() => assertReportGenerationUpdateApplied({
      updatedRows: [],
    })).toThrow("리포트 저장 결과가 비어 있습니다.");
  });

  it("실패 알림 메시지에 주문번호와 실제 오류를 포함한다", () => {
    expect(buildReportFailureNotification({
      orderId: "order-1",
      reason: "리포트 생성 처리 오류",
      error: new Error("명반 추출 데이터가 없습니다."),
    })).toBe("❌ <b>[리포트 생성 실패]</b>\n주문번호: <code>order-1</code>\n사유: 리포트 생성 처리 오류\n에러: 명반 추출 데이터가 없습니다.");
  });
});
