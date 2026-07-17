import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const CLAIM_TOKEN_TTL_MINUTES = 30;
export const ORDER_CLAIM_COOKIE_NAME = "orbit_order_claim";

interface CreateOrderClaimTokenOptions {
  now?: Date;
}

export interface CreatedOrderClaimToken {
  token: string;
  hash: string;
  expiresAt: Date;
}

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

export const hashOrderClaimToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

export function createOrderClaimToken(): string;
export function createOrderClaimToken(options: CreateOrderClaimTokenOptions): CreatedOrderClaimToken;
export function createOrderClaimToken(options?: CreateOrderClaimTokenOptions): CreatedOrderClaimToken | string {
  const token = randomBytes(32).toString("base64url");

  if (!options) {
    return token;
  }

  const now = options.now ?? new Date();

  return {
    token,
    hash: hashOrderClaimToken(token),
    expiresAt: addMinutes(now, CLAIM_TOKEN_TTL_MINUTES),
  };
}

export const verifyOrderClaimToken = ({ token, hash }: { token: string; hash: string }): boolean => {
  const tokenHash = hashOrderClaimToken(token);
  const tokenHashBuffer = Buffer.from(tokenHash, "hex");
  const expectedHashBuffer = Buffer.from(hash, "hex");

  if (tokenHashBuffer.length !== expectedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(tokenHashBuffer, expectedHashBuffer);
};

export const isOrderClaimTokenExpired = ({ expiresAt, now = new Date() }: { expiresAt: string | Date; now?: Date }): boolean => {
  return new Date(expiresAt).getTime() <= now.getTime();
};

export const serializeOrderClaimCookieValue = ({ orderId, token }: { orderId: string; token: string }): string => {
  return `${orderId}.${token}`;
};

export const parseOrderClaimCookieValue = (value: string): { orderId: string; token: string } | null => {
  const separatorIndex = value.indexOf(".");

  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return null;
  }

  return {
    orderId: value.slice(0, separatorIndex),
    token: value.slice(separatorIndex + 1),
  };
};
