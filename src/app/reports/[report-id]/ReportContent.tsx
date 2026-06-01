"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon, Check, Sparkles, Star, Target, Heart, Compass, Clock } from "lucide-react";

type Theme = "career" | "love" | "hobby" | string;

const DUMMY_REPORT = {
  teaser_quote: "잔잔한 수면 아래, 거대한 소용돌이를 품고 있는 당신.",
  core_trait: "당신은 겉보기엔 누구보다 유연하고 주변과 잘 융화되는 사람입니다. 타인의 이야기를 잘 들어주며, 어디서든 적응력이 뛰어납니다. 하지만 내면에는 한 번 목표를 정하면 끝까지 파고드는 무서운 집중력과 흔들리지 않는 신념이 자리 잡고 있습니다. 특히 위기 상황에서 당신의 진가가 발휘되며, 남들이 포기할 때 조용히 해결책을 찾아내는 끈기를 보여줍니다.",
  career_insight: "당신은 안정적인 환경보다는 자율성이 주어지고 스스로 문제를 해결할 수 있는 환경에서 폭발적으로 성장합니다. 누군가의 지시를 받기보다는, 프로젝트의 방향성을 스스로 설계할 때 가장 큰 성과를 냅니다. 기획자, 전문 연구직, 혹은 독립적인 프리랜서 성격의 직무가 당신의 강점을 극대화할 수 있습니다. 남들과 똑같은 루트를 고집하지 마세요. 당신만의 궤도를 개척할 때 가장 빛이 납니다.",
  love_insight: "당신은 섣불리 감정을 드러내지 않지만, 한 번 마음을 연 상대에게는 한없이 깊은 헌신을 보여주는 타입입니다. 가벼운 만남보다는 서로의 성장에 도움이 되는 깊은 유대감을 선호합니다. 때로는 너무 완벽한 모습을 보여주려다 스스로 지칠 수 있으니, 당신의 약점까지도 있는 그대로 사랑해 줄 수 있는 포용력 있는 사람을 만나는 것이 중요합니다.",
  wellness_insight: "당신의 에너지는 바깥으로 뻗어가기보다 내면으로 수렴하는 경향이 있습니다. 사람들과 어울리는 것도 좋지만, 혼자만의 시간을 가지며 방전된 에너지를 채우는 것이 절대적으로 필요합니다. 명상, 요가, 혼자 즐기는 수영, 혹은 조용히 깊이 파고들 수 있는 공예나 철학 공부 등이 당신의 심리적 안정감을 극대화해 줍니다.",
  periodic_insight: "2026년 하반기에는 예상치 못한 제안이나 새로운 기회가 당신을 찾아올 수 있습니다. 기존의 방식에 안주하기보다는 과감하게 새로운 시도를 해보는 것을 추천합니다. 특히 10월경에는 인간관계에서 작은 전환점이 생길 수 있으니, 열린 마음으로 다가오는 인연을 맞이하세요."
};

interface ReportContentProps {
  reportId: string;
  theme: Theme;
}

export default function ReportContent({ reportId, theme }: ReportContentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "나의 별빛 이야기 - Orbit",
          text: "오르빗에서 나만의 진짜 모습을 해독했어요! 제 별빛 이야기를 확인해보세요.",
          url: window.location.href,
        });
      } catch (error) {
        console.log("공유하기가 취소되었거나 지원하지 않습니다.", error);
      }
    } else {
      handleCopyLink();
    }
  };

  const specificInsightTitle = 
    theme === "career" ? "나만의 커리어 활용법" : 
    theme === "love" ? "나만의 관계 활용법" : 
    theme === "hobby" ? "나만의 라이프 활용법" : "나의 잠재력 활용법";

  const specificInsightText = 
    theme === "career" ? DUMMY_REPORT.career_insight : 
    theme === "love" ? DUMMY_REPORT.love_insight : 
    theme === "hobby" ? DUMMY_REPORT.wellness_insight : DUMMY_REPORT.career_insight;

  const InsightIcon = 
    theme === "career" ? Target : 
    theme === "love" ? Heart : 
    theme === "hobby" ? Compass : Star;

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-full mb-6 relative">
          <Sparkles className="w-8 h-8 text-primary relative z-10" />
          <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full"></div>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-primary mb-4 leading-relaxed">
          "{DUMMY_REPORT.teaser_quote}"
        </h2>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6 md:space-y-8">
        
        {/* Core Trait */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-white/80" />
              </div>
              <h3 className="text-xl font-bold text-white">나의 진짜 모습</h3>
            </div>
            <p className="text-white/80 leading-relaxed md:text-lg">
              {DUMMY_REPORT.core_trait}
            </p>
          </div>
        </div>

        {/* Theme Specific Insight */}
        <div className="bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl border border-primary/20 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(255,107,53,0.1)] relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <InsightIcon className="w-48 h-48 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <InsightIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary">{specificInsightTitle}</h3>
            </div>
            <p className="text-white/90 leading-relaxed md:text-lg">
              {specificInsightText}
            </p>
          </div>
        </div>

        {/* Periodic Insight */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white/80" />
              </div>
              <h3 className="text-xl font-bold text-white">다가오는 시기의 운세 흐름</h3>
            </div>
            <p className="text-white/80 leading-relaxed md:text-lg">
              {DUMMY_REPORT.periodic_insight}
            </p>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="mt-16 pt-8 border-t border-white/10 text-center">
        <h4 className="text-lg font-medium text-white/80 mb-6">내 별빛 이야기를 공유해보세요</h4>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={handleCopyLink}
            variant="outline" 
            className="w-full sm:w-auto h-14 px-8 rounded-xl border-white/20 text-white bg-white/5 hover:bg-white/10 transition-all text-base"
          >
            {copied ? (
              <>
                <Check className="mr-2 w-5 h-5 text-green-400" />
                링크 복사 완료
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 w-5 h-5 text-white/60" />
                링크 복사하기
              </>
            )}
          </Button>
          <Button 
            onClick={handleShare}
            className="w-full sm:w-auto h-14 px-8 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all text-base font-bold shadow-[0_0_15px_rgba(255,107,53,0.3)]"
          >
            <Share2 className="mr-2 w-5 h-5" />
            외부로 공유하기
          </Button>
        </div>
      </div>
    </div>
  );
}
