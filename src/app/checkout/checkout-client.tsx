"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments, TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { getOrderAction } from "@/app/actions/order";
import { getErrorMessage } from "@/lib/error-utils";

// The client key to use (provided by user for testing)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const CUSTOMER_KEY = "GUEST_" + Math.random().toString(36).substring(2, 10);

const THEME_MAP: Record<string, { title: string; price: number }> = {
  career: { title: "나의 잠재력과 커리어", price: 990 },
  love: { title: "나만의 매력과 관계", price: 0 },
  hobby: { title: "나를 채우는 여가와 웰니스", price: 500 },
};

interface OrderSummary {
  theme: string;
  amount: number;
}

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") || "";
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [themeInfo, setThemeInfo] = useState<{ title: string; price: number }>({ title: "로딩중...", price: 0 });
  const [amount, setAmount] = useState(0);

  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const initRef = useRef(false);
  const renderRef = useRef(false);

  // 1. 주문 데이터 로드
  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setErrorMsg("잘못된 접근입니다. 주문 정보를 찾을 수 없습니다.");
        return;
      }
      try {
        const orderData = await getOrderAction(orderId);
        setOrder(orderData);
        const tInfo = THEME_MAP[orderData.theme] || { title: "알 수 없는 테마", price: orderData.amount };
        setThemeInfo(tInfo);
        setAmount(orderData.amount);
        if (orderData.amount === 0) {
          setIsReady(true);
        }
      } catch (err: unknown) {
        setErrorMsg(getErrorMessage(err, "주문 정보를 불러오는데 실패했습니다."));
      }
    }
    loadOrder();
  }, [orderId]);

  // 2. 토스 위젯 초기화
  useEffect(() => {
    if (!order || order.amount === 0 || initRef.current) return; // 주문이 로드된 후 한 번만 초기화
    initRef.current = true;

    async function initializeTossPayments() {
      try {
        const tosspayments = await loadTossPayments(TOSS_CLIENT_KEY);
        // Initialize widgets
        const _widgets = tosspayments.widgets({ customerKey: CUSTOMER_KEY });
        setWidgets(_widgets);
      } catch (error) {
        console.error("Toss Payments SDK Initialization Error:", error);
      }
    }
    initializeTossPayments();
  }, [order]);

  useEffect(() => {
    if (widgets && amount > 0 && !renderRef.current) {
      renderRef.current = true;
      
      async function renderWidgets() {
        try {
          // Render Payment Method Widget
          await widgets?.setAmount({ currency: "KRW", value: amount });
          
          await Promise.all([
            widgets?.renderPaymentMethods({
              selector: "#payment-method",
              variantKey: "DEFAULT",
            }),
            widgets?.renderAgreement({
              selector: "#agreement",
              variantKey: "AGREEMENT",
            }),
          ]);

          setIsReady(true);
        } catch (error) {
          console.error("Widget render error:", error);
          // React Strict Mode 등에서 위젯이 이미 렌더링되어 에러가 나더라도
          // 화면에 위젯이 정상적으로 보인다면 결제가 진행되어야 하므로 준비 상태로 변경합니다.
          setIsReady(true);
        }
      }
      renderWidgets();
    }
  }, [widgets, amount]);

  const handlePayment = async () => {
    if (!orderId) return;

    if (order?.amount === 0) {
      window.location.href = `/checkout/success?orderId=${orderId}&paymentKey=free_${Date.now()}&amount=0&theme=${order.theme}`;
      return;
    }

    if (!widgets) return;

    // E2E 녹화용 Toss 우회
    if (process.env.NEXT_PUBLIC_E2E_MOCK === 'true') {
      window.location.href = `/checkout/success?orderId=${orderId}&paymentKey=mock_${Date.now()}&amount=${amount}`;
      return;
    }

    try {
      // Build orderName
      const orderName = `Orbit ${themeInfo.title} 리포트`;
      
      const baseUrl = window.location.origin;

      await widgets.requestPayment({
        orderId: orderId, // DB에서 생성된 주문 ID 그대로 사용
        orderName,
        successUrl: `${baseUrl}/checkout/success${window.location.search}`,
        failUrl: `${baseUrl}/checkout/fail${window.location.search}`,
        customerName: "Orbit Guest",
      });
    } catch (error) {
      console.error("Payment Error:", error);
    }
  };

  if (errorMsg || (!orderId && !isReady)) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center">
        <p className="text-white mb-4">{errorMsg || "주문 정보를 불러오는 중입니다..."}</p>
        {errorMsg && (
          <Button onClick={() => router.push("/")} className="bg-white/10 hover:bg-white/20 text-white border-none">
            메인으로 돌아가기
          </Button>
        )}
      </div>
    );
  }

  const isFreeOrder = order?.amount === 0;

  return (
    <div className={isFreeOrder ? "mx-auto flex max-w-md flex-col" : "flex flex-col lg:flex-row gap-8"}>
      {!isFreeOrder && (
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl overflow-hidden relative min-h-[400px]">
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            {/* 토스페이먼츠 위젯이 기본적으로 흰색 배경이므로, CSS 필터를 통해 다크 모드로 변환합니다. */}
            <div className="relative z-0 [filter:invert(0.93)_hue-rotate(180deg)_brightness(1.1)] mix-blend-screen opacity-90 transition-opacity duration-500">
              <div id="payment-method" className="w-full"></div>
              <div id="agreement" className="w-full mt-4"></div>
            </div>
          </div>
        </div>
      )}

      {/* Right: Order Summary */}
      <div className={isFreeOrder ? "w-full" : "w-full lg:w-[360px] shrink-0"}>
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden sticky top-24 shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white mb-1">결제 상세정보</h3>
            <p className="text-xs text-white/40">입력하신 주문 정보 및 금액입니다.</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">주문 상품</span>
              <span className="text-white font-medium text-right">{themeInfo.title}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">주문 번호</span>
              <span className="text-white font-medium truncate max-w-[200px]">{orderId}</span>
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-between items-center mt-2">
              <span className="text-white font-bold">총 결제 금액</span>
              <span className="text-primary font-bold text-2xl">{amount.toLocaleString()}원</span>
            </div>
          </div>

          <div className="p-6 bg-white/[0.02]">
            <Button 
              onClick={handlePayment} 
              disabled={!isReady}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-lg font-bold shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] transition-all disabled:opacity-50"
            >
              <CreditCard className="mr-2 w-5 h-5" />
              {order?.amount === 0 ? "0원으로 시작하기" : `${amount.toLocaleString()}원 결제하기`}
            </Button>
            
            <button 
              onClick={() => router.back()}
              className="w-full mt-4 flex justify-center items-center text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              주문서로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
