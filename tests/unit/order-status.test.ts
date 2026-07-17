import { describe, expect, it } from "vitest";

import { assertOrderStatus, isOrderStatus } from "../../src/lib/orders/types";

describe("주문 상태 타입", () => {
  it("허용된 주문 상태만 true를 반환한다", () => {
    expect(isOrderStatus("pending")).toBe(true);
    expect(isOrderStatus("paid")).toBe(true);
    expect(isOrderStatus("cancelled")).toBe(true);
    expect(isOrderStatus("done")).toBe(false);
    expect(isOrderStatus(null)).toBe(false);
  });

  it("알 수 없는 상태는 예외로 차단한다", () => {
    expect(assertOrderStatus("paid")).toBe("paid");
    expect(() => assertOrderStatus("unknown")).toThrow("알 수 없는 주문 상태입니다.");
  });
});
