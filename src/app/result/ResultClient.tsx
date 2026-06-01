"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Briefcase, Heart, Gamepad2, ArrowRight, Sparkles } from "lucide-react";
import { translateZiwei } from "@/lib/ziwei-translator";

// Grid Layout based on traditional Ziwei Doushu chart
const GRID_LAYOUT = [
  ['巳', '午', '未', '申'],
  ['辰', null, null, '酉'],
  ['卯', null, null, '戌'],
  ['寅', '丑', '子', '亥']
];

export default function ResultClient({ chartData, params }: { chartData: any, params: any }) {
  const router = useRouter();
  const [theme, setTheme] = useState<"career" | "love" | "hobby" | "">("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleNext = () => {
    setErrorMessage("");
    if (!theme) {
      setErrorMessage("분석 테마를 선택해주세요.");
      return;
    }
    
    const query = new URLSearchParams({
      date: params.date,
      time: params.time,
      gender: params.gender,
      location: params.location,
      theme,
    });
    
    router.push(`/order-form?${query.toString()}`);
  };

  const getPalaceByZhi = (zhi: string) => {
    return Object.values(chartData.palaces).find((p: any) => p.zhi === zhi) as any;
  };

  // 명궁(Life Palace) 찾기
  const lifePalace = Object.values(chartData.palaces).find((p: any) => p.name === '命宮') as any;
  const lifeMainStars = lifePalace?.stars.filter((s: any) => s.brightness !== '') || [];
  
  let targetStars = lifeMainStars;
  let isMigrationUsed = false;

  // 명궁무주성(명궁에 주성이 없는 경우) 천이궁(Migration Palace)의 별을 차용
  if (lifeMainStars.length === 0) {
    const migrationPalace = Object.values(chartData.palaces).find((p: any) => p.name === '遷移宮') as any;
    const migrationMainStars = migrationPalace?.stars.filter((s: any) => s.brightness !== '') || [];
    targetStars = migrationMainStars;
    isMigrationUsed = true;
  }

  const targetStarNames = targetStars.map((s: any) => translateZiwei(s.name)).join(', ');

  const interpretationTitle = isMigrationUsed 
    ? "당신의 명궁에 숨겨진, 매우 특별하고 흥미로운 진짜 모습입니다! ✨" 
    : "당신의 진짜 모습을 결정짓는 핵심 별자리입니다 ✨";
  
  const interpretationText = targetStarNames
    ? (isMigrationUsed 
        ? `당신의 명궁은 비어있어, 평생의 무대가 되는 맞은편 '천이궁'의 [${targetStarNames}] 에너지를 강하게 끌어다 씁니다. 빈 그릇처럼 외부 환경에 유연하게 적응하며, 밖에서 활동할 때 당신의 진짜 모습이 폭발적으로 드러납니다.`
        : `당신의 중심 별은 [${targetStarNames}]입니다. 이 별빛의 기운을 강하게 받아 타고난 강점과 고유한 매력이 당신의 진짜 모습으로 돋보입니다. 당신만의 특별한 '나 활용법'을 일깨워보세요.`)
    : "당신이라는 우주에 아주 신비로운 별빛이 숨어있습니다.";

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 fill-mode-both max-w-4xl mx-auto">
      
      {/* Unblurred Myeongban Grid */}
      <div className="w-full">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/10 p-4 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-4 grid-rows-4 gap-2 md:gap-3 aspect-square max-w-2xl mx-auto select-none">
            {GRID_LAYOUT.flat().map((zhi, idx) => {
              if (!zhi) {
                // Center 2x2 Area
                if (idx === 5) {
                  return (
                    <div key="center" className="col-span-2 row-span-2 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-white/5 p-4 text-center">
                      <div className="space-y-3">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-semibold mb-2">
                          {translateZiwei(chartData.wuXingJu.name)}
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                          {chartData.solarYear}년 {chartData.solarMonth}월 {chartData.solarDay}일
                        </h2>
                        <div className="text-white/60 text-sm md:text-base space-y-1">
                          <p>시간: {chartData.hour}시 {chartData.minute}분</p>
                          <p>명궁: {translateZiwei(chartData.mingGongZhi)}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }

              const palace = getPalaceByZhi(zhi);
              if (!palace) return <div key={idx} className="border border-white/5 rounded-xl" />;

              const isLifeOrMigration = palace.name === '命宮' || (isMigrationUsed && palace.name === '遷移宮');

              return (
                <div key={idx} className={`relative flex flex-col justify-between p-2 md:p-3 border rounded-xl overflow-hidden transition-all duration-300 ${isLifeOrMigration ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(255,107,53,0.3)]' : 'border-white/10 bg-white/[0.03]'}`}>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="flex flex-wrap gap-1">
                      {palace.stars.filter((s: any) => s.brightness !== '').map((star: any, sIdx: number) => (
                        <span key={sIdx} className="text-[10px] md:text-xs font-bold text-orange-400 leading-none">
                          {translateZiwei(star.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between w-full border-t border-white/5 pt-2">
                    <span className="text-[9px] md:text-[10px] text-white/40">{translateZiwei(palace.ganZhi)}</span>
                    <span className={`text-xs md:text-sm font-black ${isLifeOrMigration ? 'text-primary' : 'text-white/80'}`}>
                      {translateZiwei(palace.name)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Free Interpretation Section */}
      <div className="w-full">
        <div className="bg-gradient-to-br from-primary/10 to-orange-500/5 backdrop-blur-md rounded-3xl border border-primary/20 p-6 md:p-8 shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 p-4 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-primary" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm md:text-base font-bold text-primary mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              무료 기초 해석
            </h3>
            <p className="text-lg md:text-xl font-bold text-white mb-4 leading-snug">
              {interpretationTitle}
            </p>
            <div className="bg-black/30 rounded-2xl p-5 border border-white/10 shadow-inner">
              <p className="text-white/90 leading-relaxed text-sm md:text-base">
                {interpretationText}
              </p>
            </div>
            <p className="text-xs text-white/50 mt-5 text-center flex items-center justify-center gap-1">
              이외의 11개 궁과 더 디테일한 운세 흐름은 아래 테마를 선택해 확인하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="w-full flex flex-col">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-8 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">집중 분석 테마 선택</h3>
          
          <RadioGroup 
            value={theme}
            onValueChange={(v) => setTheme(v as any)}
            className="flex flex-col gap-4 flex-1"
          >
            <div>
              <RadioGroupItem value="career" id="theme-career" className="peer sr-only" />
              <Label
                htmlFor="theme-career"
                className={`flex items-center gap-4 rounded-2xl border p-5 cursor-pointer transition-all ${theme === 'career' ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white">나의 잠재력과 커리어</h4>
                  <p className="text-sm text-white/60 mt-1">타고난 강점을 극대화하는 나만의 커리어 활용법</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-400">990원</span>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="love" id="theme-love" className="peer sr-only" />
              <Label
                htmlFor="theme-love"
                className={`flex items-center gap-4 rounded-2xl border p-5 cursor-pointer transition-all ${theme === 'love' ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
              >
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-pink-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white">나만의 매력과 관계</h4>
                  <p className="text-sm text-white/60 mt-1">고유한 매력 자산을 바탕으로 한 나만의 관계 활용법</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-pink-400">990원</span>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="hobby" id="theme-hobby" className="peer sr-only" />
              <Label
                htmlFor="theme-hobby"
                className={`flex items-center gap-4 rounded-2xl border p-5 cursor-pointer transition-all ${theme === 'hobby' ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white">나를 채우는 여가와 웰니스</h4>
                  <p className="text-sm text-white/60 mt-1">내 성향에 맞춰 심리적 만족감을 높여주는 나만의 라이프 활용법</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-400">500원</span>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {errorMessage && (
            <div className="mt-6 text-sm font-medium text-red-500 text-center animate-in fade-in">
              {errorMessage}
            </div>
          )}

          <Button 
            onClick={handleNext}
            className="w-full h-14 mt-6 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-lg font-bold shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] transition-all relative overflow-hidden group"
          >
            <Sparkles className="mr-2 w-5 h-5" />
            선택한 테마의 내 별빛 이야기 들어보기
            <div className="absolute inset-0 bg-white/20 w-full translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
