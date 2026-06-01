"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Phone, Loader2 } from "lucide-react";
import { createOrderAction } from "@/app/actions/order";

const THEME_MAP: Record<string, { title: string; price: number }> = {
  career: { title: "나의 잠재력과 커리어", price: 990 },
  love: { title: "나만의 매력과 관계", price: 990 },
  hobby: { title: "나를 채우는 여가와 웰니스", price: 500 },
};

export default function OrderFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const theme = searchParams.get("theme") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const gender = searchParams.get("gender") || "";
  const location = searchParams.get("location") || "";

  const themeInfo = THEME_MAP[theme] || { title: "선택된 테마 없음", price: 0 };

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; password?: string; submit?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 3 && cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length > 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let newErrors: { phone?: string; password?: string } = {};
    let hasError = false;

    // 1. 전화번호 유효성 검사 (숫자 10~11자리 + 하이픈 = 12~13자리)
    if (!phone || phone.length < 12) {
      newErrors.phone = "정확한 휴대전화 번호를 입력해주세요.";
      hasError = true;
    }

    // 2 & 3. 비밀번호 검증: 단순 공백 제한 및 XSS/악성 입력 차단
    const trimmedPassword = password.trim();
    if (!trimmedPassword || trimmedPassword.length < 4) {
      newErrors.password = "공백 제외 최소 4자리 이상 입력해주세요.";
      hasError = true;
    } else if (/[<>&"']/.test(password)) {
      // XSS 방어를 위해 특수문자 입력 차단
      newErrors.password = "<, >, &, \", ' 와 같은 특수문자는 사용할 수 없습니다.";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const saju_data = {
        date,
        time,
        gender,
        location
      };

      const { orderId } = await createOrderAction({
        phone,
        password,
        saju_data,
        theme,
        amount: themeInfo.price
      });

      // 성공 시 orderId를 가지고 checkout 페이지로 이동
      const query = new URLSearchParams(searchParams.toString());
      query.set("orderId", orderId);
      
      // 보안상 password는 URL 파라미터에서 제외
      if (query.has("password")) query.delete("password");
      
      router.push(`/checkout?${query.toString()}`);
    } catch (error: any) {
      console.error(error);
      setErrors({ submit: error.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Order Summary */}
      <div className="bg-white/[0.02] border-b border-white/10 p-6">
        <h3 className="text-sm font-semibold text-white/50 mb-3">내 별빛 이야기 정보</h3>
        <div className="flex justify-between items-start mb-2">
          <span className="text-white font-bold text-lg">{themeInfo.title}</span>
          <span className="text-primary font-bold text-lg">{themeInfo.price.toLocaleString()}원</span>
        </div>
        <div className="text-xs text-white/40 flex flex-wrap gap-2 mt-3">
          {date && <span className="bg-white/5 px-2 py-1 rounded-md">생년월일: {date}</span>}
          {time && <span className="bg-white/5 px-2 py-1 rounded-md">시간: {time}</span>}
          {gender && <span className="bg-white/5 px-2 py-1 rounded-md">성별: {gender === "M" ? "남성" : "여성"}</span>}
          <span className="bg-white/5 px-2 py-1 rounded-md">지역: {(location && location !== "undefined") ? location : "서울/경기"}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/80">휴대전화 번호</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input 
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="010-0000-0000"
                className={`pl-10 bg-white/5 text-white h-12 rounded-xl focus-visible:ring-primary ${errors.phone ? 'border-red-500 ring-2 ring-red-500/20' : 'border-white/10'}`}
                maxLength={13}
              />
            </div>
            {errors.phone ? (
              <p className="text-[11px] text-red-500 pl-1 mt-1 font-medium">{errors.phone}</p>
            ) : (
              <p className="text-[11px] text-white/40 pl-1 mt-1">해독 완료 알림 및 별빛 이야기 조회 시 사용됩니다.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">비밀번호 (4자리 이상)</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                className={`pl-10 bg-white/5 text-white h-12 rounded-xl focus-visible:ring-primary ${errors.password ? 'border-red-500 ring-2 ring-red-500/20' : 'border-white/10'}`}
                minLength={4}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-500 pl-1 mt-1 font-medium">{errors.password}</p>
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="text-center text-red-500 font-medium text-sm">
            {errors.submit}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-lg font-bold shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              내 별빛 이야기 보러가기
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
