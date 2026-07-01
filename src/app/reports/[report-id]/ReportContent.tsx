"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon, Check, Sparkles, Star, Target, Heart, Compass, Clock, Loader2, RefreshCcw, BookOpenText, Quote, Layers3 } from "lucide-react";
import { makeReportPublic, generateReportAction } from "@/app/actions/report";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Theme = "career" | "love" | "hobby" | string;

interface ReportData {
  markdown?: string;
  teaser_quote?: string;
  core_trait?: string;
  theme_insight?: string;
  periodic_insight?: string;
}

interface MarkdownSection {
  title: string;
  body: string;
}

interface ReportContentProps {
  reportId: string;
  theme: Theme;
  status: string;
  content: ReportData | null;
}

interface ThemeVisual {
  eyebrow: string;
  title: string;
  description: string;
  gradient: string;
  icon: typeof Star;
}

const THEME_VISUALS: Record<string, ThemeVisual> = {
  career: {
    eyebrow: "Career Reading",
    title: "나의 커리어 별빛 이야기",
    description: "일하는 방식, 강점, 성장 방향을 한 장의 리포트처럼 정리했습니다.",
    gradient: "from-orange-400/25 via-amber-300/10 to-transparent",
    icon: Target,
  },
  love: {
    eyebrow: "Love Reading",
    title: "나의 관계와 매력 이야기",
    description: "관계에서 드러나는 반응, 끌림, 가까워질수록 살아나는 매력을 읽습니다.",
    gradient: "from-rose-400/25 via-orange-300/10 to-transparent",
    icon: Heart,
  },
  hobby: {
    eyebrow: "Wellness Reading",
    title: "나의 회복과 라이프 이야기",
    description: "나에게 맞는 에너지 관리와 여가 리듬을 감각적으로 정리했습니다.",
    gradient: "from-indigo-400/25 via-cyan-300/10 to-transparent",
    icon: Compass,
  },
};

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-8 mt-2 text-3xl font-black leading-tight tracking-tight text-white md:text-4xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-5 mt-12 flex items-center gap-3 rounded-2xl border border-orange-300/15 bg-orange-400/10 px-5 py-4 text-2xl font-black text-orange-100 shadow-[0_0_30px_rgba(255,107,53,0.08)] first:mt-0">
      <Sparkles className="h-5 w-5 shrink-0 text-orange-300" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-8 border-l-2 border-orange-300/50 pl-4 text-xl font-bold text-white">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-4 text-[1.02rem] leading-8 text-white/78 md:text-lg md:leading-9">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-5 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5 text-white/75">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-5 list-decimal space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5 pl-9 text-white/75">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 leading-7 marker:text-orange-300">
      {children}
    </li>
  ),
  strong: ({ children }) => <strong className="font-black text-orange-100">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-2xl border border-orange-300/20 bg-orange-400/10 p-5 text-white/80">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-white/10" />,
};

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

  const currentThemeVisual = THEME_VISUALS[theme] ?? {
    eyebrow: "Orbit Reading",
    title: "나의 별빛 이야기",
    description: "개인 명반을 바탕으로 정리한 맞춤형 리포트입니다.",
    gradient: "from-orange-400/25 via-white/5 to-transparent",
    icon: Star,
  };
  const ThemeVisualIcon = currentThemeVisual.icon;
  const markdownSections = content.markdown ? splitMarkdownSections(cleanMarkdown(content.markdown)) : [];

  return (
    <div className="mx-auto w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
        <div className={`relative bg-gradient-to-br ${currentThemeVisual.gradient} p-6 md:p-8`}>
          <div className="absolute right-6 top-6 hidden rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/45 md:block">
            {currentThemeVisual.eyebrow}
          </div>
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-sm font-bold text-orange-100">
                <Sparkles className="h-4 w-4 text-orange-300" />
                해독 완료
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
                {currentThemeVisual.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-white/62 md:text-lg">
                {currentThemeVisual.description}
              </p>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/10 shadow-inner">
              <ThemeVisualIcon className="h-10 w-10 text-orange-100" />
            </div>
          </div>
        </div>

        {!content.markdown && content.teaser_quote && (
          <div className="border-t border-white/10 p-6 md:p-8">
            <div className="flex gap-4 rounded-3xl border border-white/10 bg-black/20 p-5">
              <Quote className="mt-1 h-6 w-6 shrink-0 text-orange-300" />
              <p className="text-xl font-black leading-relaxed text-white md:text-2xl">
                {content.teaser_quote}
              </p>
            </div>
          </div>
        )}
      </section>

      {content.markdown ? (
        <div className="space-y-5 md:space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <BookOpenText className="h-4 w-4 text-orange-200" />
              섹션형 리포트
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Layers3 className="h-4 w-4 text-orange-200" />
              항목별 카드 구성
            </span>
          </div>

          {markdownSections.map((section, index) => {
            const sectionNumber = String(index + 1).padStart(2, "0");
            const isLeadSection = index === 0;

            return (
              <section
                key={`${section.title}-${index}`}
                className={`relative overflow-hidden rounded-[2rem] border shadow-2xl backdrop-blur-xl ${
                  isLeadSection
                    ? "border-orange-300/20 bg-gradient-to-br from-orange-400/12 via-white/[0.04] to-white/[0.02]"
                    : "border-white/10 bg-white/[0.035]"
                }`}
              >
                <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-orange-300/70 via-white/10 to-transparent" />
                <div className="absolute right-[-120px] top-[-80px] h-72 w-72 rounded-full bg-orange-500/10 blur-[90px]" />
                <div className="relative z-10 p-5 md:p-8">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-400/12 text-sm font-black text-orange-100">
                      {sectionNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-200/60">
                        Orbit Report Section
                      </p>
                      <h2 className="text-2xl font-black leading-snug text-white md:text-3xl">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 md:p-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {section.body}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-orange-400/10 to-transparent" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Star className="h-5 w-5 text-orange-100" />
                </div>
                <h3 className="text-xl font-black text-white">나의 진짜 모습</h3>
              </div>
              <p className="whitespace-pre-line text-lg leading-9 text-white/80">
                {content.core_trait}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-orange-300/20 bg-gradient-to-br from-orange-400/10 to-transparent p-6 shadow-[0_0_40px_rgba(255,107,53,0.1)] backdrop-blur-xl md:p-8">
            <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-10">
              <InsightIcon className="h-48 w-48 text-orange-200" />
            </div>
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-400/15">
                  <InsightIcon className="h-5 w-5 text-orange-200" />
                </div>
                <h3 className="text-xl font-black text-orange-100">{specificInsightTitle}</h3>
              </div>
              <p className="whitespace-pre-line text-lg leading-9 text-white/88">
                {content.theme_insight}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Clock className="h-5 w-5 text-orange-100" />
                </div>
                <h3 className="text-xl font-black text-white">다가오는 시기의 운세 흐름</h3>
              </div>
              <p className="whitespace-pre-line text-lg leading-9 text-white/80">
                {content.periodic_insight}
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-center shadow-2xl backdrop-blur-xl md:p-8">
        <h4 className="text-lg font-bold text-white/85">내 별빛 이야기를 공유해보세요</h4>
        <p className="mt-2 text-sm text-white/45">공유 링크를 만들면 로그인 없이도 이 리포트를 열람할 수 있습니다.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="h-14 w-full rounded-xl border-white/20 bg-white/5 px-8 text-base text-white transition-all hover:bg-white/10 sm:w-auto"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-5 w-5 text-green-400" />
                링크 복사 완료
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-5 w-5 text-white/60" />
                링크 복사하기
              </>
            )}
          </Button>
          <Button
            onClick={handleShare}
            className="h-14 w-full rounded-xl bg-orange-500 px-8 text-base font-black text-white shadow-[0_0_20px_rgba(255,107,53,0.3)] transition-all hover:bg-orange-400 sm:w-auto"
          >
            <Share2 className="mr-2 h-5 w-5" />
            외부로 공유하기
          </Button>
        </div>
      </section>
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

function splitMarkdownSections(markdown: string): MarkdownSection[] {
  const normalized = markdown.trim();
  if (!normalized) return [];

  const headingMatches = Array.from(normalized.matchAll(/^#{1,2}\s+(.+)$/gm));
  if (headingMatches.length === 0) {
    return [{ title: "나의 별빛 이야기", body: normalized }];
  }

  const intro = normalized.slice(0, headingMatches[0].index ?? 0).trim();
  const sections: MarkdownSection[] = [];

  if (intro) {
    sections.push({ title: "요약", body: intro });
  }

  headingMatches.forEach((match, index) => {
    const headingStart = match.index ?? 0;
    const bodyStart = headingStart + match[0].length;
    const nextHeadingStart = headingMatches[index + 1]?.index ?? normalized.length;
    const title = match[1].replace(/^[0-9]+[.)]\s*/, "").trim();
    const body = normalized.slice(bodyStart, nextHeadingStart).trim();

    sections.push({
      title: title || `항목 ${index + 1}`,
      body: body || "내용을 준비 중입니다.",
    });
  });

  return sections;
}
