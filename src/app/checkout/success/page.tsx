import { AccountLinkingForm } from "./AccountLinkingForm";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { confirmPaymentAction } from "@/app/actions/payment";
import { getOrderAction } from "@/app/actions/order";
import { getErrorMessage } from "@/lib/error-utils";


export const metadata: Metadata = {
  title: "결제 완료 - Orbit",
};

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] }> }) {
  const params = await searchParams;
  const rawOrderId = params.orderId;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : (rawOrderId || "알 수 없음");
  
  const rawAmount = params.amount;
  const amount = Array.isArray(rawAmount) ? rawAmount[0] : (rawAmount || "0");
  
  const rawTheme = params.theme;
  const theme = Array.isArray(rawTheme) ? rawTheme[0] : (rawTheme || "");
  
  const rawPaymentKey = params.paymentKey;
  const paymentKey = Array.isArray(rawPaymentKey) ? rawPaymentKey[0] : (rawPaymentKey || "");

  // [보안] 결제 금액 변조(해킹) 방어: 백엔드(서버 컴포넌트)에서 금액 재검증
  // getOrderAction을 통해 DB에 저장된 원래 주문 정보 확인
  let order;
  try {
    order = await getOrderAction(orderId);
  } catch {
    redirect(`/checkout/fail?code=ORDER_NOT_FOUND&message=${encodeURIComponent("주문 정보를 찾을 수 없습니다.")}`);
  }

  const expectedAmount = order.amount;
  
  if (!expectedAmount || Number(amount) !== expectedAmount) {
    // 악의적인 금액 변조가 감지된 경우 결제 취소(실패) 페이지로 강제 리다이렉트
    redirect(`/checkout/fail?code=AMOUNT_TAMPERED&message=${encodeURIComponent("결제 금액이 변조되어 결제가 자동 취소되었습니다.")}`);
  }

  // Toss Payment 승인 요청 (중복 승인 방지: 이미 DB가 paid 상태면 스킵)
  if (order.status !== 'paid') {
    try {
      await confirmPaymentAction({ paymentKey, orderId, amount: Number(amount) });
    } catch (error: unknown) {
      redirect(`/checkout/fail?code=PAYMENT_CONFIRM_FAILED&message=${encodeURIComponent(getErrorMessage(error))}`);
    }
  }
  
  return (
    <main className="min-h-screen bg-[#05050a] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">별빛 이야기 해독 준비 완료</h1>
        <p className="text-white/60 mb-8">결제가 정상적으로 처리되어 당신만의 진짜 모습을 읽어낼 준비를 마쳤습니다.</p>
        
        <div className="bg-white/5 rounded-2xl p-6 text-left mb-8 space-y-4">
          <div className="flex justify-between items-center text-sm gap-4">
            <span className="text-white/50 whitespace-nowrap flex-shrink-0">주문번호</span>
            <span className="text-white font-mono text-xs break-all text-right">{orderId}</span>
          </div>
          <div className="flex justify-between items-center text-sm gap-4">
            <span className="text-white/50 whitespace-nowrap flex-shrink-0">결제금액</span>
            <span className="text-white font-bold text-right">{Number(amount).toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-center text-sm gap-4">
            <span className="text-white/50 whitespace-nowrap flex-shrink-0">테마</span>
            <span className="text-white text-right">{theme === 'career' ? '커리어' : theme === 'love' ? '연애' : theme === 'hobby' ? '여가/웰니스' : theme}</span>
          </div>
        </div>

        <AccountLinkingForm orderId={orderId} />
      </div>
    </main>
  );
}
