"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getProductByTheme, isFreeDemoPaymentAllowed } from "@/lib/products/catalog";
import { classifyPaymentKey } from "@/lib/payments/payment-policy";
import { sendTelegramNotification } from "@/lib/telegram";

interface OrderPaymentSnapshot {
  theme: string;
  amount: number;
}

interface TossPaymentData {
  totalAmount: number;
  method: string;
  status: string;
  approvedAt?: string;
  message?: string;
  code?: string;
}

const createAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const normalizeTossResponse = (value: unknown): TossPaymentData => {
  if (typeof value !== "object" || value === null) {
    return { totalAmount: 0, method: "알 수 없음", status: "unknown", message: String(value) };
  }

  const record = value as Record<string, unknown>;

  return {
    totalAmount: typeof record.totalAmount === "number" ? record.totalAmount : 0,
    method: typeof record.method === "string" ? record.method : "알 수 없음",
    status: typeof record.status === "string" ? record.status : "unknown",
    approvedAt: typeof record.approvedAt === "string" ? record.approvedAt : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
  };
};

const getOrderPaymentSnapshot = async (orderId: string): Promise<OrderPaymentSnapshot> => {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("orders")
    .select("theme, amount")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    throw new Error("주문 정보를 찾을 수 없습니다.");
  }

  return {
    theme: String(data.theme),
    amount: Number(data.amount),
  };
};

const assertPaymentAmount = (order: OrderPaymentSnapshot, amount: number) => {
  const product = getProductByTheme(order.theme);

  if (order.amount !== product.amount || amount !== product.amount) {
    throw new Error("주문 금액이 서버 상품표와 일치하지 않습니다.");
  }

  return product;
};

export async function confirmPaymentAction(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const { paymentKey, orderId, amount } = params;

  if (!paymentKey || !orderId || Number.isNaN(amount) || amount < 0) {
    throw new Error("결제 승인에 필요한 파라미터가 누락되었습니다.");
  }

  const order = await getOrderPaymentSnapshot(orderId);
  const product = assertPaymentAmount(order, amount);
  const paymentKeyKind = classifyPaymentKey({
    paymentKey,
    nodeEnv: process.env.NODE_ENV,
    isFreeDemoOrder: isFreeDemoPaymentAllowed(product),
  });
  const adminClient = createAdminClient();

  if (paymentKeyKind === "free-demo") {
    const { error: orderError } = await adminClient
      .from("orders")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("theme", product.theme)
      .eq("amount", product.amount);

    if (orderError) {
      console.error("Free order update failed:", orderError);
      throw new Error("무료 결제 처리 중 오류가 발생했습니다.");
    }

    const { error: paymentError } = await adminClient
      .from("payments")
      .insert({
        order_id: orderId,
        payment_key: paymentKey,
        amount: 0,
        method: "무료결제",
        status: "done",
        paid_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error("Failed to insert free payment record:", JSON.stringify(paymentError));
    }

    return { success: true, paymentData: { totalAmount: 0, method: "무료결제", status: "DONE" } };
  }

  if (paymentKeyKind === "test-mock") {
    const { error: updateError } = await adminClient
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    if (updateError) {
      console.error("Mock order update failed:", updateError);
      throw new Error("결제 처리 중 오류가 발생했습니다.");
    }

    return { success: true };
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  }

  const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encryptedSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  const responseText = await response.text();
  let paymentData: TossPaymentData;
  try {
    paymentData = normalizeTossResponse(JSON.parse(responseText));
  } catch {
    paymentData = { totalAmount: 0, method: "알 수 없음", status: "unknown", message: responseText || `HTTP status ${response.status}` };
  }

  if (!response.ok) {
    console.error("Toss Payment Confirm Error:", JSON.stringify(paymentData, null, 2));

    const isAlreadyProcessed =
      paymentData.code === "ALREADY_PROCESSED_PAYMENT" ||
      (paymentData.message && paymentData.message.includes("이미 처리된"));

    if (!isAlreadyProcessed) {
      await sendTelegramNotification(`🚨 <b>[결제 실패]</b>\n주문번호: <code>${orderId}</code>\n금액: ${amount}원\n사유: ${paymentData.message || "알 수 없는 오류"}`);
      throw new Error(paymentData.message || `결제 승인 중 오류가 발생했습니다. (상태코드: ${response.status})`);
    }

    console.log("이미 승인된 토스 결제입니다. DB 업데이트 로직으로 넘어갑니다.");
  }

  if (paymentData.totalAmount !== product.amount) {
    throw new Error("토스 승인 금액이 서버 상품표와 일치하지 않습니다.");
  }

  const { error: orderError } = await adminClient
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("amount", product.amount);

  if (orderError) {
    console.error("Failed to update order status:", orderError);
  }

  const { error: paymentError } = await adminClient
    .from("payments")
    .insert({
      order_id: orderId,
      payment_key: paymentKey,
      amount: paymentData.totalAmount,
      method: paymentData.method,
      status: paymentData.status ? paymentData.status.toLowerCase() : "done",
      paid_at: paymentData.approvedAt,
    });

  if (paymentError) {
    console.error("Failed to insert payment record:", JSON.stringify(paymentError));
  }

  await sendTelegramNotification(`✅ <b>[결제 성공]</b>\n주문번호: <code>${orderId}</code>\n금액: ${paymentData.totalAmount}원\n수단: ${paymentData.method}`);

  return { success: true, paymentData };
}
