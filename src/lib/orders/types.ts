export const ORDER_STATUS_VALUES = ["pending", "paid", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const isOrderStatus = (value: unknown): value is OrderStatus => {
  return typeof value === "string" && ORDER_STATUS_VALUES.includes(value as OrderStatus);
};

export const assertOrderStatus = (value: unknown): OrderStatus => {
  if (!isOrderStatus(value)) {
    throw new Error("알 수 없는 주문 상태입니다.");
  }

  return value;
};
