import { Metadata } from "next";
import { AdminLoginForm } from "./AdminLoginForm";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "관리자 로그인 - Orbit",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#05050a] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-2xl font-extrabold text-white text-center mb-2">Orbit 관리자</h1>
        <p className="text-white/60 text-center text-sm mb-8">관리자 전용 접근 페이지입니다.</p>
        
        <AdminLoginForm />
      </div>
    </main>
  );
}
