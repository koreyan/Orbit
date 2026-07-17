"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkUserToOrderAction } from "@/app/actions/order";
import { Lock, Phone, Sparkles } from "lucide-react";
import { getErrorMessage } from "@/lib/error-utils";

export function AccountLinkingForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!phone || phone.length < 10) {
      setErrorMsg("정확한 휴대폰 번호를 입력해주세요.");
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg("비밀번호는 4자리 이상 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await linkUserToOrderAction({ orderId, phone, password });
      // 성공 시 리포트 페이지로 이동
      router.push(`/reports/${orderId}`);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "계정 등록에 실패했습니다. 다시 시도해주세요."));
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-left space-y-4">
        <h3 className="text-lg font-bold text-white mb-2">결과 보관을 위한 계정 설정</h3>
        <p className="text-xs text-white/60 mb-4">
          결제하신 리포트를 나중에도 다시 볼 수 있도록 연락처와 비밀번호를 설정해주세요.<br/>
          (기존 고객은 기존에 쓰시던 비밀번호를 입력하시면 갱신됩니다.)
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            휴대폰 번호
          </label>
          <Input
            type="tel"
            placeholder="01012345678 (숫자만 입력)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            className="bg-black/50 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
            required
            maxLength={11}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            주문 비밀번호
          </label>
          <Input
            type="password"
            placeholder="비밀번호 4자리 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black/50 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
            required
            minLength={4}
          />
        </div>

        {errorMsg && (
          <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg hover:from-orange-500 hover:to-orange-400 shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 animate-spin" />
            계정 연동 중...
          </span>
        ) : (
          "저장하고 내 별빛 이야기 보러가기"
        )}
      </Button>
    </form>
  );
}
