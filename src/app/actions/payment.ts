"use server";

import { createClient } from "@/lib/supabase/server";
import { generateReportAction } from "@/app/actions/report";
import { sendTelegramNotification } from "@/lib/telegram";

export async function confirmPaymentAction(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const { paymentKey, orderId, amount } = params;

  if (!paymentKey || !orderId || !amount) {
    throw new Error("결제 승인에 필요한 파라미터가 누락되었습니다.");
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  }

  const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");

  // 1. Toss Payments 결제 승인 API 호출
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

  const paymentData = await response.json();

  if (!response.ok) {
    console.error("Toss Payment Confirm Error:", paymentData);
    
    const isAlreadyProcessed = 
      paymentData.code === "ALREADY_PROCESSED_PAYMENT" || 
      (paymentData.message && paymentData.message.includes("이미 처리된"));

    if (!isAlreadyProcessed) {
      // 텔레그램 알림: 결제 승인 실패
      await sendTelegramNotification(`🚨 <b>[결제 실패]</b>\n주문번호: <code>${orderId}</code>\n금액: ${amount}원\n사유: ${paymentData.message || "알 수 없는 오류"}`);
    }
    
    throw new Error(paymentData.message || "결제 승인 중 오류가 발생했습니다.");
  }

  // 2. 결제 승인 성공 시 DB 업데이트
  // Toss 결제 후 쿠키 유실(SameSite 이슈) 대비 및 안전한 백엔드 처리를 위해 Admin 권한 사용
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // (1) orders 테이블 상태 변경
  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (orderError) {
    console.error("Failed to update order status:", orderError);
    // Toss 결제 취소 API를 호출해야 할 수도 있지만, 일단 로그만 남김
  }

  // (2) payments 테이블 인서트
  const { error: paymentError } = await supabase
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

  // 텔레그램 알림: 결제 성공
  await sendTelegramNotification(`✅ <b>[결제 성공]</b>\n주문번호: <code>${orderId}</code>\n금액: ${paymentData.totalAmount}원\n수단: ${paymentData.method}`);

  // 백그라운드 리포트 생성 트리거 제거 (Vercel Serverless Function 생명주기 문제로 인해 클라이언트에서 직접 호출하도록 변경)

  return { success: true, paymentData };
}
