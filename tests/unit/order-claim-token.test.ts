import { describe, expect, it } from "vitest";

import {
  CLAIM_TOKEN_TTL_MINUTES,
  createOrderClaimToken,
  hashOrderClaimToken,
  isOrderClaimTokenExpired,
  verifyOrderClaimToken,
} from "../../src/lib/orders/claim-token";

describe("주문 claim token", () => {
  it("원문 토큰은 저장하지 않고 hash로 검증한다", () => {
    const token = createOrderClaimToken();
    const hash = hashOrderClaimToken(token);

    expect(token).not.toBe(hash);
    expect(verifyOrderClaimToken({ token, hash })).toBe(true);
    expect(verifyOrderClaimToken({ token: `${token}x`, hash })).toBe(false);
  });

  it("기본 만료 시간은 현재 시점 기준 30분 뒤다", () => {
    const now = new Date("2026-07-17T00:00:00.000Z");
    const { expiresAt } = createOrderClaimToken({ now });

    expect(expiresAt.toISOString()).toBe("2026-07-17T00:30:00.000Z");
    expect(CLAIM_TOKEN_TTL_MINUTES).toBe(30);
  });

  it("만료 시각이 현재 시각 이하이면 만료로 판단한다", () => {
    const now = new Date("2026-07-17T00:30:00.000Z");

    expect(isOrderClaimTokenExpired({ expiresAt: "2026-07-17T00:29:59.999Z", now })).toBe(true);
    expect(isOrderClaimTokenExpired({ expiresAt: "2026-07-17T00:30:00.000Z", now })).toBe(true);
    expect(isOrderClaimTokenExpired({ expiresAt: "2026-07-17T00:30:00.001Z", now })).toBe(false);
  });
});
