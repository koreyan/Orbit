export type PaymentKeyKind = "free-demo" | "test-mock" | "toss";

interface ClassifyPaymentKeyParams {
  paymentKey: string;
  nodeEnv: string | undefined;
  isFreeDemoOrder: boolean;
}

const E2E_MOCK_PAYMENT_KEY = "E2E_TEST_MOCK_PAYMENT_KEY";

export const isTestMockPaymentKey = (paymentKey: string): boolean => {
  return paymentKey.startsWith("mock_") || paymentKey === E2E_MOCK_PAYMENT_KEY;
};

export const classifyPaymentKey = ({
  paymentKey,
  nodeEnv,
  isFreeDemoOrder,
}: ClassifyPaymentKeyParams): PaymentKeyKind => {
  if (paymentKey.startsWith("free_")) {
    if (!isFreeDemoOrder) {
      throw new Error("무료 결제를 허용할 수 없는 주문입니다.");
    }

    return "free-demo";
  }

  if (isTestMockPaymentKey(paymentKey)) {
    if (nodeEnv === "production") {
      throw new Error("테스트 결제키는 운영 환경에서 사용할 수 없습니다.");
    }

    return "test-mock";
  }

  return "toss";
};
