"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 자동 하이픈 추가 (010-0000-0000)
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 3 && val.length <= 7) {
      val = val.replace(/(\d{3})(\d+)/, "$1-$2");
    } else if (val.length > 7) {
      val = val.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
    }
    setPhone(val);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("phone", phone);
      formData.append("password", password);
      
      // Server Action 호출
      const result = await loginAction(formData);
      if (result.success) {
        router.push("/reports");
      }
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white/80">휴대전화 번호</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={13}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary focus-visible:border-primary transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/80">비밀번호</Label>
          <Input
            id="password"
            type="password"
            placeholder="기록해둔 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary focus-visible:border-primary transition-all"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading || !phone || !password}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-lg font-bold transition-all disabled:opacity-50 mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              별빛을 찾는 중...
            </>
          ) : (
            "내 별빛 이야기 꺼내보기"
          )}
        </Button>
      </form>
    </div>
  );
}
