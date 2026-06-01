import { Suspense } from "react";
import OrderFormClient from "./OrderFormClient";
import { BackButton } from "@/components/ui/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "주문서 작성 - Orbit",
  description: "선택한 자미두수 분석 테마에 대한 주문 정보를 작성합니다.",
};

export default function OrderFormPage() {
  return (
    <main className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 relative overflow-hidden">
      <BackButton />
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">내 별빛 이야기 기록하기</h1>
          <p className="text-white/60">언제든 다시 꺼내볼 수 있도록 연락처와 비밀번호를 남겨주세요.</p>
        </div>
        
        <Suspense fallback={<div className="text-white/50 text-center py-10">데이터를 불러오는 중...</div>}>
          <OrderFormClient />
        </Suspense>
      </div>
    </main>
  );
}
