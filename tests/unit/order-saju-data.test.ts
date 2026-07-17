import { describe, expect, it } from "vitest";

import { parseOrderSajuData } from "../../src/lib/orders/order-saju-data";

describe("주문 saju_data 파서", () => {
  it("유효한 주문 사주 입력만 getMyeongban 입력으로 변환한다", () => {
    expect(parseOrderSajuData({
      date: "1990-01-01",
      time: "12:30",
      gender: "M",
      location: "Seoul",
      extra: "ignored",
    })).toEqual({
      date: "1990-01-01",
      time: "12:30",
      gender: "M",
      location: "Seoul",
    });
  });

  it("location이 없는 legacy 데이터는 빈 문자열로 보정한다", () => {
    expect(parseOrderSajuData({ date: "1990-01-01", time: "00:00", gender: "F" })).toEqual({
      date: "1990-01-01",
      time: "00:00",
      gender: "F",
      location: "",
    });
  });

  it("형식이 맞지 않는 date/time/gender는 null을 반환한다", () => {
    expect(parseOrderSajuData({ date: "1990/01/01", time: "12:00", gender: "M" })).toBeNull();
    expect(parseOrderSajuData({ date: "1990-01-01", time: "24:00", gender: "M" })).toBeNull();
    expect(parseOrderSajuData({ date: "1990-01-01", time: "12:00", gender: "X" })).toBeNull();
    expect(parseOrderSajuData(null)).toBeNull();
  });
});
