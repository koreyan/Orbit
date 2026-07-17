import { Suspense } from "react";
import CheckoutClient from "./checkout-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제하기 - Orbit",
  description: "안전한 결제 시스템으로 자미두수 분석 리포트를 결제하세요.",
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#05050a] py-20 px-4 relative overflow-hidden flex justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">내 별빛 이야기 결제</h1>
          <p className="text-white/60">별빛 이야기 해독을 위한 마지막 단계입니다.</p>
        </div>
        
        <Suspense fallback={<div className="text-white/50 text-center py-20">결제 모듈을 불러오는 중입니다...</div>}>
          <CheckoutClient />
        </Suspense>
      </div>
    </main>
  );
}
