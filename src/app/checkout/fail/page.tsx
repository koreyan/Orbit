import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제 실패 - Orbit",
};

export default async function CheckoutFailPage({ searchParams }: { searchParams: Promise<{ [key: string]: string }> }) {
  const params = await searchParams;
  const message = params.message || "알 수 없는 오류가 발생했습니다.";
  const code = params.code || "UNKNOWN_ERROR";

  return (
    <main className="min-h-screen bg-[#05050a] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full mix-blend-screen filter blur-[128px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-white mb-2">별빛 이야기 결제 실패</h1>
        <p className="text-white/60 mb-8">오류 사유를 확인하신 후 다시 시도해 주세요.</p>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-left mb-8 space-y-2">
          <div className="flex flex-col text-sm">
            <span className="text-red-400 font-medium mb-1">오류 메시지</span>
            <span className="text-white">{message}</span>
          </div>
          <div className="flex flex-col text-sm pt-2">
            <span className="text-red-400 font-medium mb-1">오류 코드</span>
            <span className="text-white/60 font-mono text-xs">{code}</span>
          </div>
        </div>

        <Link href="/">
          <Button variant="outline" className="w-full h-14 rounded-xl border-white/20 text-white hover:bg-white/10 transition-all">
            다시 별빛 이야기 시작하기
          </Button>
        </Link>
      </div>
    </main>
  );
}
