"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarBackground } from "@/components/ui/star-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Info, User, UserRound } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  
  // Date states
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  // Time states
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  
  // Gender state
  const [gender, setGender] = useState<"M" | "F" | "">("");
  
  // Location state
  const [location, setLocation] = useState<string>("서울/경기");

  // Validation & UI states
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const handleYearChange = (val: string) => {
    if (val === "") { setYear(""); return; }
    let num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num > 2100) num = 2100;
    setYear(num.toString());
  };

  const handleMonthChange = (val: string) => {
    if (val === "") { setMonth(""); return; }
    let num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num > 12) num = 12;
    setMonth(num.toString());
  };

  const handleDayChange = (val: string) => {
    if (val === "") { setDay(""); return; }
    let num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num > 31) num = 31;
    setDay(num.toString());
  };

  const handleHourChange = (val: string) => {
    if (val === "") { setHour(""); return; }
    let num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num > 12) num = 12;
    setHour(num.toString());
  };

  const handleMinuteChange = (val: string) => {
    if (val === "") { setMinute(""); return; }
    let num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num > 59) num = 59;
    setMinute(num.toString());
  };

  const handleViewResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const newErrors: Record<string, boolean> = {};

    if (!gender) newErrors.gender = true;
    if (!year) newErrors.year = true;
    if (!month) newErrors.month = true;
    if (!day) newErrors.day = true;
    if (!hour) newErrors.hour = true;
    if (!minute) newErrors.minute = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMessage("모든 필수 정보를 입력해주세요.");
      return;
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (y < 1900) {
      setErrors({ year: true });
      setErrorMessage("태어난 년도는 1900년 이후로 입력해주세요.");
      return;
    }

    // 날짜 유효성 검사 (예: 2월 30일 방어)
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
      setErrors({ year: true, month: true, day: true });
      setErrorMessage("존재하지 않는 날짜입니다. 다시 확인해주세요.");
      return;
    }

    setErrors({});
    setIsLoading(true);

    // 포맷팅 (YYYY-MM-DD)
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // 12시간제 -> 24시간제 변환 (HH:MM)
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    const formattedTime = `${h.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;

    const params = new URLSearchParams({
      date: formattedDate,
      time: formattedTime,
      gender,
      location,
      isLunar: "false" // 항상 양력 고정
    });

    // 상태 업데이트가 렌더링된 후 라우팅되도록 약간의 지연 추가
    setTimeout(() => {
      router.push(`/result?${params.toString()}`);
    }, 100);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <StarBackground />
      
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px] pointer-events-none" />
      
      <div className="z-10 text-center mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
          별빛이 알려주는<br className="hidden md:block" /> 나의 진짜 모습
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          자미두수를 활용하여<br className="hidden md:block"/> 
          나 활용법을 알아보세요.
        </p>
      </div>

      <form 
        onSubmit={handleViewResult}
        className="z-10 w-full max-w-md p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 fill-mode-both"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-white/80">성별</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender("M")}
                className={`flex flex-col items-center justify-between rounded-xl border p-4 transition-all ${
                  gender === "M"
                    ? "border-primary text-primary bg-primary/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
                } ${errors.gender ? "border-red-500" : ""}`}
              >
                <User className="mb-2 h-5 w-5" />
                남성
              </button>
              <button
                type="button"
                onClick={() => setGender("F")}
                className={`flex flex-col items-center justify-between rounded-xl border p-4 transition-all ${
                  gender === "F"
                    ? "border-primary text-primary bg-primary/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
                } ${errors.gender ? "border-red-500" : ""}`}
              >
                <UserRound className="mb-2 h-5 w-5" />
                여성
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white/80">생년월일 (양력)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="YYYY"
                  min="1900"
                  max="2100"
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className={`bg-white/5 border-white/10 text-white focus-visible:ring-primary h-12 rounded-xl text-center pr-6 ${errors.year ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">년</span>
              </div>
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="MM"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className={`bg-white/5 border-white/10 text-white focus-visible:ring-primary h-12 rounded-xl text-center pr-6 ${errors.month ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">월</span>
              </div>
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="DD"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className={`bg-white/5 border-white/10 text-white focus-visible:ring-primary h-12 rounded-xl text-center pr-6 ${errors.day ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">일</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white/80">태어난 시간</Label>
            <div className="flex gap-3">
              {/* AM/PM Toggle */}
              <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden h-12 w-1/3 shrink-0 p-1">
                <button 
                  type="button" 
                  onClick={() => setAmpm("AM")} 
                  className={`flex-1 rounded-lg text-sm transition-all duration-200 ${ampm === "AM" ? 'bg-primary text-white font-bold shadow-md' : 'text-white/60 hover:text-white'}`}
                >
                  오전
                </button>
                <button 
                  type="button" 
                  onClick={() => setAmpm("PM")} 
                  className={`flex-1 rounded-lg text-sm transition-all duration-200 ${ampm === "PM" ? 'bg-primary text-white font-bold shadow-md' : 'text-white/60 hover:text-white'}`}
                >
                  오후
                </button>
              </div>

              {/* Hour / Minute */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="12"
                    min="1"
                    max="12"
                    value={hour}
                    onChange={(e) => handleHourChange(e.target.value)}
                    className={`bg-white/5 border-white/10 text-white focus-visible:ring-primary h-12 rounded-xl text-center pr-6 ${errors.hour ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">시</span>
                </div>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="00"
                    min="0"
                    max="59"
                    value={minute}
                    onChange={(e) => handleMinuteChange(e.target.value)}
                    className={`bg-white/5 border-white/10 text-white focus-visible:ring-primary h-12 rounded-xl text-center pr-6 ${errors.minute ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">분</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-white/80">태어난 지역</Label>
            <Select value={location} onValueChange={(v) => setLocation(v || "")}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary">
                <SelectValue placeholder="지역을 선택해주세요" />
              </SelectTrigger>
              <SelectContent className="bg-[#11111a] border-white/10 text-white rounded-xl">
                <SelectItem value="서울/경기">서울/경기 (표준시 기준)</SelectItem>
                <SelectItem value="강원도">강원도</SelectItem>
                <SelectItem value="충청도">충청도</SelectItem>
                <SelectItem value="전라도">전라도</SelectItem>
                <SelectItem value="경상도">경상도</SelectItem>
                <SelectItem value="제주도">제주도</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 mb-4 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-primary/90 leading-snug">
            정확한 자미두수 분석을 위해 <strong>양력 생년월일</strong>과 <strong>태어난 시간 및 지역</strong>을 기입해 주세요.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 text-sm font-medium text-red-500 text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-lg font-bold shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,53,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 transition-all duration-300"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "별빛 해독 중..." : "내 별빛 이야기 들어보기"}
        </Button>
      </form>
    </div>
  );
}
