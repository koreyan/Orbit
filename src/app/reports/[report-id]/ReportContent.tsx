"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon, Check, Sparkles, Star, Target, Heart, Compass, Clock, Loader2, RefreshCcw } from "lucide-react";
import { makeReportPublic } from "@/app/actions/report";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Theme = "career" | "love" | "hobby" | string;

interface ReportData {
  markdown?: string;
  teaser_quote?: string;
  core_trait?: string;
  theme_insight?: string;
  periodic_insight?: string;
}

interface ReportContentProps {
  reportId: string;
  theme: Theme;
  status: string;
  content: ReportData | null;
}

import { generateReportAction } from "@/app/actions/report";

export default function ReportContent({ reportId, theme, status, content }: ReportContentProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // React 18 Strict Mode 에서 useEffect가 두 번 실행되는 것을 방지하기 위한 Guard
  const hasTriggeredRef = useRef(false);

  // 로딩 지연 상태 타이머 (5분 설정)
  const [elapsedTime, setElapsedTime] = useState(0);
  const isDelayed = elapsedTime >= 300;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "pending" || status === "generating") {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    }
  }, [status]);

  // 폴링(Polling) 및 생성 트리거 로직
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === "pending") {
      // Vercel Serverless 환경에서 백그라운드 태스크가 조기 종료되는 문제를 방지하기 위해,
      // 클라이언트(브라우저)에서 명시적으로 Server Action을 호출하여 HTTP 연결을 유지시킵니다.
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        generateReportAction(reportId).then(() => {
          router.refresh();
        }).catch(err => {
          console.error("Report generation error:", err);
        });
      }
      
      interval = setInterval(() => {
        router.refresh();
      }, 3000);
    } else if (status === "generating") {
      interval = setInterval(() => {
        router.refresh();
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    }
  }, [status, reportId, router]);

  const [isMakingPublic, setIsMakingPublic] = useState(false);

  const handleMakePublic = async () => {
    if (!isMakingPublic) {
      setIsMakingPublic(true);
      try {
        await makeReportPublic(reportId);
      } catch (e) {
        console.error("Failed to make public", e);
      }
    }
  };

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      await handleMakePublic();
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await handleMakePublic();
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

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await generateReportAction(reportId);
      router.refresh();
    } catch (err) {
      console.error("Regeneration failed", err);
      alert("글 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (status === "failed") {
    return (
      <div className="w-full max-w-3xl mx-auto py-32 text-center animate-in fade-in px-4">
        <h2 className="text-2xl font-bold text-red-400 mb-4">별빛의 흐름이 잠시 끊어졌습니다.</h2>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          흩어진 별빛을 다시 모아 해독하는 데 최대 3분 정도 소요될 수 있습니다.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={handleRegenerate} 
            disabled={isRegenerating}
            className="bg-primary hover:bg-orange-500 text-white rounded-xl px-8 h-12 w-full sm:w-auto"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-white/60" />
                별빛 다시 읽어내기...
              </>
            ) : (
              <>
                <RefreshCcw className="w-5 h-5 mr-2" />
                별빛 다시 읽어내기
              </>
            )}
          </Button>
          <Button 
            onClick={() => router.push("/reports")} 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10 h-12 px-8 w-full sm:w-auto"
          >
            보관함으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (status !== "completed" || !content) {
    return (
      <div className="w-full max-w-3xl mx-auto py-40 flex flex-col items-center justify-center animate-in fade-in">
        <div className="relative mb-8">
          <Sparkles className="w-16 h-16 text-primary animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full animate-pulse delay-75"></div>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-primary mb-4 text-center">
          별빛을 해석하고 있습니다
        </h2>
        <p className="text-white/60 text-center flex flex-col items-center gap-2 mb-8">
          <span className="flex items-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
            수천 개의 성향 데이터를 바탕으로 초개인화된 리포트를 작성 중입니다.
          </span>
          <span className="text-sm opacity-80">(최대 5분까지 소요될 수 있습니다)</span>
        </p>

        {isDelayed && (
          <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl text-center max-w-md w-full animate-in fade-in slide-in-from-bottom-4">
            <p className="text-white/80 mb-6">
              예상보다 시간이 조금 더 걸리고 있습니다.<br/>
              계속 기다리시거나, 아래 옵션을 선택해 주세요.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleRegenerate} 
                disabled={isRegenerating}
                className="bg-primary hover:bg-orange-500 text-white rounded-xl h-12 w-full"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-white/60" />
                    별빛 다시 읽어내기...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-5 h-5 mr-2" />
                    별빛 다시 읽어내기 (재생성)
                  </>
                )}
              </Button>
              <Button 
                onClick={() => alert("환불 기능은 아직 준비 중입니다.")}
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 h-12 w-full"
              >
                결제 취소 및 환불하기
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const specificInsightTitle = 
    theme === "career" ? "나만의 커리어 활용법" : 
    theme === "love" ? "나만의 관계 활용법" : 
    theme === "hobby" ? "나만의 라이프 활용법" : "나의 잠재력 활용법";

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
        {!content.markdown && (
          <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-primary mb-4 leading-relaxed">
            &quot;{content.teaser_quote}&quot;
          </h2>
        )}
      </div>

      {/* Main Content Sections */}
      {content.markdown ? (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10 prose prose-invert prose-orange max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cleanMarkdown(content.markdown)}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
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
              <p className="text-white/80 leading-relaxed md:text-lg whitespace-pre-line">
                {content.core_trait}
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
              <p className="text-white/90 leading-relaxed md:text-lg whitespace-pre-line">
                {content.theme_insight}
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
              <p className="text-white/80 leading-relaxed md:text-lg whitespace-pre-line">
                {content.periodic_insight}
              </p>
            </div>
          </div>
        </div>
      )}

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

function cleanMarkdown(text?: string): string {
  if (!text) return "";
  let cleaned = text.trim();
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.substring("```markdown".length).trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring("```".length).trim();
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - "```".length).trim();
  }
  return cleaned;
}
