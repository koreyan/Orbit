import { describe, expect, it } from "vitest";

import {
  getProductByTheme,
  isFreeDemoPaymentAllowed,
  resolveOrderProduct,
} from "../../src/lib/products/catalog";

describe("서버 상품표", () => {
  it("클라이언트 금액 대신 서버 상품표 금액으로 주문 상품을 확정한다", () => {
    const product = resolveOrderProduct({ theme: "love", clientAmount: 990 });

    expect(product).toEqual({
      theme: "love",
      displayName: "나만의 매력과 관계",
      amount: 0,
      enabled: true,
      freeDemo: true,
    });
  });

  it("현재 비활성 테마는 주문 생성 대상에서 거부한다", () => {
    expect(() => resolveOrderProduct({ theme: "career", clientAmount: 990 })).toThrow(
      "현재 주문할 수 없는 테마입니다."
    );
  });

  it("무료 결제 스킵은 활성화된 0원 데모 상품에만 허용한다", () => {
    expect(isFreeDemoPaymentAllowed(getProductByTheme("love"))).toBe(true);
    expect(isFreeDemoPaymentAllowed(getProductByTheme("career"))).toBe(false);
    expect(isFreeDemoPaymentAllowed(getProductByTheme("hobby"))).toBe(false);
  });

  it("알 수 없는 테마는 거부한다", () => {
    expect(() => getProductByTheme("unknown-theme")).toThrow("지원하지 않는 테마입니다.");
  });
});
