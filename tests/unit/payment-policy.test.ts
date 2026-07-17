import { describe, expect, it } from "vitest";

import { classifyPaymentKey } from "../../src/lib/payments/payment-policy";

describe("결제키 정책", () => {
  it("무료 결제키는 서버 상품표가 허용한 0원 데모 주문에서만 승인한다", () => {
    expect(
      classifyPaymentKey({
        paymentKey: "free_123",
        nodeEnv: "production",
        isFreeDemoOrder: true,
      })
    ).toBe("free-demo");
  });

  it("무료 결제키라도 0원 데모 주문이 아니면 거부한다", () => {
    expect(() =>
      classifyPaymentKey({
        paymentKey: "free_123",
        nodeEnv: "production",
        isFreeDemoOrder: false,
      })
    ).toThrow("무료 결제를 허용할 수 없는 주문입니다.");
  });

  it("mock 결제키와 고정 E2E 결제키는 production에서 거부한다", () => {
    expect(() =>
      classifyPaymentKey({ paymentKey: "mock_123", nodeEnv: "production", isFreeDemoOrder: false })
    ).toThrow("테스트 결제키는 운영 환경에서 사용할 수 없습니다.");

    expect(() =>
      classifyPaymentKey({
        paymentKey: "E2E_TEST_MOCK_PAYMENT_KEY",
        nodeEnv: "production",
        isFreeDemoOrder: false,
      })
    ).toThrow("테스트 결제키는 운영 환경에서 사용할 수 없습니다.");
  });

  it("mock 결제키는 비운영 환경에서만 테스트 우회로 분류한다", () => {
    expect(
      classifyPaymentKey({ paymentKey: "mock_123", nodeEnv: "test", isFreeDemoOrder: false })
    ).toBe("test-mock");
    expect(
      classifyPaymentKey({
        paymentKey: "E2E_TEST_MOCK_PAYMENT_KEY",
        nodeEnv: "development",
        isFreeDemoOrder: false,
      })
    ).toBe("test-mock");
  });
});
