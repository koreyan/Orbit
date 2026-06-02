import type { Metadata } from "next";
import LoginClient from "./LoginClient";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "로그인 - Orbit",
  description: "연락처와 비밀번호를 입력하여 내 별빛 이야기를 확인하세요.",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 relative overflow-hidden">
      <BackButton />
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-3">
            내 별빛 이야기 찾기
          </h1>
          <p className="text-white/60">나만의 별빛 이야기를 꺼내보기 위해 기록해둔 정보를 입력해주세요.</p>
        </div>
        
        <LoginClient />
      </div>
    </main>
  );
}
