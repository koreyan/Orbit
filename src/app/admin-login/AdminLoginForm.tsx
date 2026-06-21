"use client";

import { useState } from "react";
import { adminLoginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail } from "lucide-react";

export function AdminLoginForm() {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      await adminLoginAction(formData);
      // 성공 시 redirect("/admin")이 서버에서 트리거됩니다.
    } catch (err: any) {
      // NEXT_REDIRECT 에러 처리
      if (err.message && err.message.includes("NEXT_REDIRECT")) {
        return; // 정상 리다이렉트이므로 무시
      }
      setErrorMsg(err.message || "관리자 로그인에 실패했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          이메일
        </label>
        <Input
          type="email"
          name="email"
          placeholder="admin@example.com"
          required
          className="bg-black/50 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          비밀번호
        </label>
        <Input
          type="password"
          name="password"
          placeholder="••••••••"
          required
          className="bg-black/50 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
        />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-14 mt-4 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg hover:from-orange-500 hover:to-orange-400 shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] transition-all disabled:opacity-50"
      >
        {isLoading ? "로그인 중..." : "관리자 로그인"}
      </Button>
    </form>
  );
}
