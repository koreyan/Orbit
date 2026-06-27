"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Briefcase, Heart, Gamepad2, Sparkles, Info } from "lucide-react";
import { translateZiwei } from "@/lib/ziwei-translator";
import { MAJOR_STARS, LUCKY_STARS, UNLUCKY_STARS } from "@/lib/ziwei-extractor";
import { calculateLiunian } from "@orrery/core/ziwei";
import { getErrorMessage } from "@/lib/error-utils";
import type { DaxianItem, LiunianData, ResultInterpretation, ResultParams, ZiweiChart } from "@/lib/ziwei-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Grid Layout based on traditional Ziwei Doushu chart
const GRID_LAYOUT = [
  ['巳', '午', '未', '申'],
  ['辰', null, null, '酉'],
  ['卯', null, null, '戌'],
  ['寅', '丑', '子', '亥']
];

export default function ResultClient({ 
  chartData, 
  daxianList,
  currentLiunian,
  interpretation,
  params 
}: { 
  chartData: ZiweiChart,
  daxianList: DaxianItem[],
  currentLiunian: LiunianData,
  interpretation: ResultInterpretation,
  params: ResultParams
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<"career" | "love" | "hobby" | "">("");
  const [errorMessage, setErrorMessage] = useState("");

  // 상태 관리: 대한 인덱스와 유년 연도
  const [selectedDaHanIndex, setSelectedDaHanIndex] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - chartData.solarYear + 1; // 대략적인 나이 추산
    const index = daxianList.findIndex(d => age >= d.ageStart && age <= d.ageEnd);
    return index !== -1 ? index : 0;
  });
  
  const [selectedLiuNianYear, setSelectedLiuNianYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  // 선택된 유년 정보 동적 계산
  const activeLiunian = useMemo(() => {
    try {
      return calculateLiunian(chartData, selectedLiuNianYear) as LiunianData;
    } catch (e) {
      console.error("Failed to calculate Liunian in client", e);
      return currentLiunian;
    }
  }, [chartData, selectedLiuNianYear, currentLiunian]);

  // 대운이 변경되면 해당 대운의 시작 연도로 유년을 자동 변경
  const handleDaHanChange = (index: number) => {
    setSelectedDaHanIndex(index);
    const daxian = daxianList[index];
    const newYear = chartData.solarYear + daxian.ageStart - 1;
    setSelectedLiuNianYear(newYear);
  };

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const handleNext = async () => {
    setErrorMessage("");
    if (!theme) {
      setErrorMessage("분석 테마를 선택해주세요.");
      return;
    }
    
    setIsCreatingOrder(true);
    try {
      const amount = theme === "career" || theme === "love" ? 990 : 500;
      const { createAnonymousOrderAction } = await import("@/app/actions/order");
      
      const { orderId } = await createAnonymousOrderAction({
        saju_data: { 
          date: params.date, 
          time: params.time, 
          gender: params.gender, 
          location: params.location 
        },
        theme,
        amount
      });
      
      router.push(`/checkout?orderId=${orderId}`);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, "주문 생성에 실패했습니다. 다시 시도해주세요."));
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // DB에서 가져온 해석 정보를 렌더링 변수로 할당
  const targetStarNames = interpretation.primaryStars.join(', ');
  const interpretationTitle = interpretation.borrowed 
    ? `당신의 천이궁에 숨겨진, [${targetStarNames}]의 특별한 진짜 모습입니다! ✨` 
    : `당신의 진짜 모습을 결정짓는 핵심 별자리 [${targetStarNames}]입니다 ✨`;

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
                    <div key="center" className="col-span-2 row-span-2 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-white/5 p-2 md:p-4 text-center overflow-hidden">
                      <div className="space-y-1 md:space-y-3 w-full px-1">
                        <div className="inline-block px-2 py-0.5 md:px-4 md:py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[9px] md:text-sm font-semibold mb-1 md:mb-2 whitespace-nowrap">
                          {translateZiwei(chartData.wuXingJu.name)}
                        </div>
                        <h2 className="text-[11px] sm:text-xs md:text-xl lg:text-2xl font-bold text-white mb-1 md:mb-2 whitespace-nowrap">
                          {chartData.solarYear}년 {chartData.solarMonth}월 {chartData.solarDay}일
                        </h2>
                        <div className="text-white/60 text-[9px] sm:text-[10px] md:text-base space-y-0.5 md:space-y-1 whitespace-nowrap">
                          <p>시간: {chartData.hour}시 {chartData.minute}분</p>
                          <p>명궁: {translateZiwei(chartData.mingGongZhi)}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }

              const palace = chartData.palaces[Object.keys(chartData.palaces).find(k => chartData.palaces[k].zhi === zhi) as string];
              if (!palace) return <div key={idx} className="aspect-square hidden md:block" />;

              const isLifePalace = palace.name === '命宮';
              const isMigrationPalace = palace.name === '遷移宮';
              const isLifeOrMigration = isLifePalace || (interpretation.borrowed && isMigrationPalace);
              
              const isDaHanMing = activeLiunian && palace.name === activeLiunian.daxianPalaceName;
              const isLiuNianMing = activeLiunian && palace.name === activeLiunian.natalPalaceAtMing;

              return (
                <div 
                  key={idx} 
                  className={`
                    relative aspect-square flex flex-col p-1 md:p-3 rounded-xl md:rounded-2xl 
                    bg-white/[0.02] backdrop-blur-sm transition-all duration-300
                    ${isLiuNianMing ? 'border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-10 scale-[1.02]' : 
                      isDaHanMing ? 'border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] z-10 scale-[1.02]' : 
                      isLifeOrMigration ? 'border-2 border-primary shadow-[0_0_15px_rgba(217,70,239,0.2)] z-10 scale-[1.02]' : 'border border-white/10'}
                  `}
                >
                  {/* 배지 렌더링 */}
                  {isDaHanMing && (
                    <div className="absolute -top-2 md:-top-3 left-1 md:left-2 bg-amber-500 text-black text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded shadow-lg z-20">
                      10년운
                    </div>
                  )}
                  {isLiuNianMing && (
                    <div className="absolute -top-2 md:-top-3 right-1 md:right-2 bg-emerald-500 text-black text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded shadow-lg z-20">
                      1년운
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-0.5 md:gap-1 overflow-y-auto no-scrollbar min-h-0 pt-1 md:pt-0">
                    
                    {/* 주성 (Major Stars) */}
                    <div className="flex flex-col gap-0.5 md:gap-1">
                      {palace.stars.filter((s) => MAJOR_STARS.includes(s.name)).map((star, sIdx: number) => (
                        <span key={`m-${sIdx}`} className="text-[10px] md:text-sm font-bold text-amber-400 leading-tight flex flex-wrap items-center">
                          {translateZiwei(star.name)}
                          {star.siHua && <span className="text-[8px] md:text-[10px] bg-white/20 text-white rounded px-0.5 md:px-1 ml-0.5 md:ml-1">[{translateZiwei(star.siHua)}]</span>}
                        </span>
                      ))}
                    </div>

                    {/* 길성 (Lucky Stars) */}
                    <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                      {palace.stars.filter((s) => LUCKY_STARS.includes(s.name)).map((star, sIdx: number) => (
                        <span key={`l-${sIdx}`} className="text-[8px] md:text-xs font-semibold text-emerald-400 leading-none flex items-center">
                          {translateZiwei(star.name)}
                          {star.siHua && <span className="text-[7px] md:text-[9px] bg-white/20 text-white rounded px-0.5 md:px-1 ml-0.5">[{translateZiwei(star.siHua)}]</span>}
                        </span>
                      ))}
                    </div>

                    {/* 흉성 (Unlucky Stars) */}
                    <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                      {palace.stars.filter((s) => UNLUCKY_STARS.includes(s.name)).map((star, sIdx: number) => (
                        <span key={`u-${sIdx}`} className="text-[8px] md:text-xs font-semibold text-rose-400 leading-none flex items-center">
                          {translateZiwei(star.name)}
                          {star.siHua && <span className="text-[7px] md:text-[9px] bg-white/20 text-white rounded px-0.5 md:px-1 ml-0.5">[{translateZiwei(star.siHua)}]</span>}
                        </span>
                      ))}
                    </div>

                  </div>
                  <div className="mt-auto flex items-end justify-between w-full border-t border-white/5 pt-0.5 md:pt-1 shrink-0">
                    <span className="text-[8px] md:text-[10px] text-white/40 leading-none">{translateZiwei(palace.ganZhi)}</span>
                    <span className={`text-[9px] md:text-sm font-black leading-none ${isLifeOrMigration ? 'text-primary' : 'text-white/80'}`}>
                      {translateZiwei(palace.name)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 운세 시기 정보 (대한 / 유년) 인터랙티브 타임라인 */}
        {daxianList && activeLiunian && (
          <div className="mt-6 w-full bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 shadow-inner backdrop-blur-md">
            
            {/* 상단 툴바 (가이드 모달 포함) */}
            <div className="flex justify-between items-end mb-6">
              <div className="flex flex-col">
                <span className="text-white/80 font-bold text-sm md:text-base">타임라인 탐색기</span>
                <span className="text-white/40 text-xs mt-1">보고 싶은 시기를 선택하세요</span>
              </div>
              
              <Dialog>
                <DialogTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors text-xs font-semibold cursor-pointer">
                  <Info className="w-3.5 h-3.5" />
                  운세 보는 법
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md max-h-[85vh] overflow-y-auto no-scrollbar">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      자미두수 가이드
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                      운세 보는 법과 주요 용어 사전을 확인하세요.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-2 text-sm leading-relaxed text-white/80">
                    <div className="space-y-8">
                      {/* 파트 1: 보는 법 */}
                      <div>
                        <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-4 text-white">👀 명반과 운세 보는 법</h3>
                        <div className="space-y-5">
                          <div>
                            <h4 className="text-primary font-bold mb-2 flex items-center gap-2">
                              <span className="bg-primary/20 px-2 py-0.5 rounded text-xs">1단계</span> 
                              시기를 주관하는 명궁 찾기
                            </h4>
                            <p className="text-xs text-white/80">자미두수는 시기마다 &apos;나의 중심(명궁)&apos;이 이동합니다. 10년 단위의 운은 <strong className="text-amber-400">대한(大限)</strong>, 1년 단위의 운은 <strong className="text-emerald-400">유년(流年)</strong>이라고 부릅니다. 하단에서 시기를 선택하면, 상단 명반 표에 배지가 표시되어 그 시기의 명궁 위치를 알려줍니다.</p>
                          </div>

                          <div>
                            <h4 className="text-primary font-bold mb-2 flex items-center gap-2">
                              <span className="bg-primary/20 px-2 py-0.5 rounded text-xs">2단계</span> 
                              위치한 궁의 의미 해석하기
                            </h4>
                            <p className="mb-2 text-xs text-white/80">배지가 놓인 궁위(예: 교우궁, 관록궁 등)는 <strong>그 시기에 가장 큰 영향을 미치는 환경과 사건의 테마</strong>를 의미합니다.</p>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-xs">
                              <p className="text-white/50 mb-1">💡 예시: 올해 1년 운 배지가 <strong>&apos;교우궁(交友宮)&apos;</strong>에 있다면?</p>
                              <p>올해는 <strong>대인관계, 친구, 직장 동료, 고객</strong>과 관련된 이슈가 한 해의 중심 테마가 됩니다. 새로운 인연을 맺거나 인간관계에서 에너지를 많이 쓰게 될 수 있습니다.</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-primary font-bold mb-2 flex items-center gap-2">
                              <span className="bg-primary/20 px-2 py-0.5 rounded text-xs">3단계</span> 
                              궁 안의 별(성요)로 길흉 파악하기
                            </h4>
                            <p className="mb-2 text-xs text-white/80">해당 궁 안에 어떤 별이 있는지 확인하세요. 별의 기질에 따라 구체적인 사건의 양상이 달라집니다.</p>
                            <ul className="list-disc pl-5 space-y-2 text-xs text-white/80">
                              <li><strong>길성이 많을 때:</strong> 그 테마(예: 교우궁이면 대인관계)에서 귀인의 도움을 받거나 인기가 상승합니다.</li>
                              <li><strong>흉성이 많을 때:</strong> 배신, 구설수 등 인간관계에서의 갈등과 스트레스가 발생할 수 있어 주의가 필요합니다.</li>
                              <li><strong>사화(화록/화권/화과/화기):</strong> 별 이름 옆에 [록], [기] 등이 붙어 있다면 에너지가 폭발적으로 증폭되는 시기입니다. 특히 [화기]는 장애물을 의미하므로 조심스럽게 접근해야 합니다.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* 파트 2: 용어 사전 */}
                      <div>
                        <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-4 text-white mt-8">📖 필수 용어 사전</h3>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-primary font-bold mb-2">12궁 (인생의 12가지 무대)</h4>
                            <ul className="list-disc pl-5 space-y-1.5 text-xs text-white/80">
                              <li><strong>명궁:</strong> 나의 본질, 성격, 전반적인 운세</li>
                              <li><strong>형제궁:</strong> 형제, 동업자, 가까운 지인과의 관계</li>
                              <li><strong>부처궁:</strong> 연애운, 배우자 및 이성과의 관계</li>
                              <li><strong>자녀궁:</strong> 자녀운, 아랫사람, 나의 성적 매력</li>
                              <li><strong>재백궁:</strong> 재물운, 돈을 버는 방식과 금전 감각</li>
                              <li><strong>질액궁:</strong> 건강운, 나의 신체적 특징</li>
                              <li><strong>천이궁:</strong> 외부 활동, 이동, 대인관계를 맺는 방식</li>
                              <li><strong>교우궁:</strong> 직장 동료, 일반적인 대인관계, 고객</li>
                              <li><strong>관록궁:</strong> 직업운, 일하는 스타일, 커리어 발전</li>
                              <li><strong>전택궁:</strong> 부동산, 주거 환경, 가풍 및 저축</li>
                              <li><strong>복덕궁:</strong> 정신적 만족도, 취미, 내면의 행복</li>
                              <li><strong>부모궁:</strong> 부모님, 상사, 윗사람과의 관계</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-primary font-bold mb-2">14주성 (운의 흐름을 주관하는 별)</h4>
                            <p className="text-[11px] text-white/60 mb-2">각 별이 운(대운/유년)으로 들어올 때 길흉과 사건의 테마가 어떻게 변하는지 보여줍니다.</p>
                            <ul className="list-disc pl-5 space-y-1.5 text-xs text-white/80">
                              <li><strong>자미(紫微):</strong> 운의 상승을 이끄는 귀인의 별. 귀인의 도움으로 위기를 돌파하며, 승진이나 명예 상승의 운이 따릅니다.</li>
                              <li><strong>천기(天機):</strong> 기회와 변동의 별. 두뇌 회전이 빨라지며 이직, 이사, 새로운 프로젝트 등 바쁘게 움직일 일이 많아지는 운입니다.</li>
                              <li><strong>태양(太陽):</strong> 발산과 명예의 별. 대외적인 활동이 늘어나고 이름이 널리 알려지며, 타인을 이끌거나 베푸는 위치에 서게 됩니다.</li>
                              <li><strong>무곡(武曲):</strong> 결단과 재물의 별. 강한 실행력과 결단력을 바탕으로 실질적인 재물을 쟁취하는 금전운이 강하게 작용합니다.</li>
                              <li><strong>천동(天同):</strong> 복과 여유의 별. 큰 노력 없이도 귀인의 조력으로 자연스럽게 일이 풀리며, 평안함을 누리는 길운입니다.</li>
                              <li><strong>염정(廉貞):</strong> 변화와 매력의 별. 사람들의 시선을 끄는 매력이 상승하여 대인관계와 인맥이 확장되거나 극적인 감정의 변화를 겪는 운입니다.</li>
                              <li><strong>천부(天府):</strong> 금고와 수성(지킴)의 별. 재물을 잃지 않고 지키는 운이 강해지며, 묵직하고 안정적인 환경 속에서 자산을 축적합니다.</li>
                              <li><strong>태음(太陰):</strong> 수렴과 숨은 재물의 별. 겉으로 드러나지 않게 차곡차곡 돈이 모이며, 부동산이나 저축 등 장기적인 금전운에 유리합니다.</li>
                              <li><strong>탐랑(貪狼):</strong> 욕망과 교제의 별. 횡재수나 유흥, 사교 활동이 폭발적으로 늘어나며, 새로운 인간관계를 통해 기회가 열립니다.</li>
                              <li><strong>거문(巨門):</strong> 말(言)과 연구의 별. 언변이나 전문 지식을 활용하여 이득을 얻으나, 시기와 질투로 인한 구설수나 시비가 따를 수 있는 운입니다.</li>
                              <li><strong>천상(天相):</strong> 조력과 신용의 별. 계약이나 문서운이 좋아지며, 타인과의 협력이나 신용을 바탕으로 일이 순조롭게 풀리는 운입니다.</li>
                              <li><strong>천량(天梁):</strong> 위기 극복과 보호의 별. 큰 위기가 닥쳐도 결국에는 무사히 해결되는 &apos;선흉후길(先凶後吉)&apos;의 든든한 보호 운이 따릅니다.</li>
                              <li><strong>칠살(七殺):</strong> 개척과 돌파의 별. 기존의 것을 허물고 완전히 새로운 길을 개척해야 하는, 험난하지만 역동적이고 큰 성취를 이루는 운입니다.</li>
                              <li><strong>파군(破軍):</strong> 파괴와 창조의 별. 예상치 못한 급격한 변화, 이직, 이사 등 낡은 것을 깨부수고 새롭게 판을 짜는 거대한 변동운입니다.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-primary font-bold mb-2">보조성 (서포터 별)</h4>
                            
                            <h5 className="text-emerald-400 font-bold mb-1 mt-2">길성 (기회를 증폭시키는 귀인)</h5>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-white/80">
                              <li><strong>좌보(左輔) / 우필(右弼):</strong> 실질적 도움을 주는 귀인, 동료나 파트너의 강력한 조력운</li>
                              <li><strong>천괴(天魁) / 천월(天鉞):</strong> 윗사람이나 제도의 발탁, 보이지 않는 행운의 기회</li>
                              <li><strong>문창(文昌) / 문곡(文曲):</strong> 시험 합격, 승진, 문서운 상승 및 뛰어난 재능과 말솜씨 발휘</li>
                            </ul>

                            <h5 className="text-rose-400 font-bold mb-1 mt-3">흉성 (변수와 시련을 주는 장애물)</h5>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-white/80">
                              <li><strong>경양(擎羊):</strong> 빠르고 강한 충돌, 치열한 경쟁, 수술수나 돌발 사고 주의</li>
                              <li><strong>타라(陀羅):</strong> 일의 지연과 답보, 끈질기게 괴롭히는 장애물, 속앓이</li>
                              <li><strong>화성(火星) / 영성(鈴星):</strong> 순간적인 폭발력, 분노와 스트레스, 급격한 체력 및 재물 소모</li>
                              <li><strong>지공(地空) / 지겁(地劫):</strong> 정신적 공허함, 갑작스러운 물질적 손실, 예측 불허의 변동</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-primary font-bold mb-2">사화 (四化: 에너지를 증폭시키는 방아쇠)</h4>
                            <p className="text-[11px] text-white/60 mb-2">별의 본래 성질을 극대화시키거나 변화시키는 특수한 기운입니다.</p>
                            <ul className="list-disc pl-5 space-y-1.5 text-xs text-white/80">
                              <li><strong className="text-amber-400">화록(化祿):</strong> <span className="text-white/60">풍요의 에너지.</span> 재물과 인연이 폭발적으로 늘어나며, 일이 순조롭게 열리는 길운입니다.</li>
                              <li><strong className="text-blue-400">화권(化權):</strong> <span className="text-white/60">권력의 에너지.</span> 주도권을 쥐게 되며, 목표를 성취하기 위해 강한 추진력이 발휘됩니다.</li>
                              <li><strong className="text-purple-400">화과(化科):</strong> <span className="text-white/60">명예의 에너지.</span> 이름이 널리 알려지고, 어려운 상황에서도 귀인의 조력을 받게 됩니다.</li>
                              <li><strong className="text-rose-500">화기(化忌):</strong> <span className="text-white/60">장애물 에너지.</span> 일의 지연, 갈등, 집착 등 막히는 일이 발생해 수성과 주의가 필요한 시기입니다.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 1단: 대한 선택 (10년) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-white/80 text-sm font-bold">10년 운 (대한) 선택</span>
              </div>
              <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                {daxianList.map((daxian, idx) => {
                  const isActive = selectedDaHanIndex === idx;
                  return (
                    <button
                      key={`daxian-${idx}`}
                      onClick={() => handleDaHanChange(idx)}
                      className={`
                        flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border
                        ${isActive 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}
                      `}
                    >
                      {daxian.ageStart}~{daxian.ageEnd}세
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2단: 유년 선택 (1년) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-white/80 text-sm font-bold">1년 운 (유년) 선택</span>
              </div>
              <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const daxian = daxianList[selectedDaHanIndex];
                  const year = chartData.solarYear + daxian.ageStart - 1 + idx;
                  const isActive = selectedLiuNianYear === year;
                  
                  return (
                    <button
                      key={`liunian-${year}`}
                      onClick={() => setSelectedLiuNianYear(year)}
                      className={`
                        flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border
                        ${isActive 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}
                      `}
                    >
                      {year}년
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 현재 선택된 테마 요약 */}
            <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row gap-3 items-center justify-center text-sm">
              <span className="text-white/70">
                선택하신 시기의 <strong className="text-amber-400">대한 명궁은 [{translateZiwei(activeLiunian.daxianPalaceName)}]</strong>, 
                <strong className="text-emerald-400"> 유년 명궁은 [{translateZiwei(activeLiunian.natalPalaceAtMing)}]</strong>에 위치합니다.
              </span>
              <span className="text-xs text-white/40 hidden md:block">|</span>
              <span className="text-xs text-white/40">명반에서 하이라이트된 궁을 확인하세요.</span>
            </div>
            
          </div>
        )}
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
              <p className="text-white/90 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                {interpretation.coreTrait}
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
            onValueChange={(v) => setTheme(v as "career" | "love" | "hobby")}
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
            disabled={isCreatingOrder}
            className="w-full h-12 md:h-14 mt-6 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-sm sm:text-base md:text-lg font-bold shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] transition-all relative overflow-hidden group px-2 md:px-4 disabled:opacity-50"
          >
            <Sparkles className={`mr-1.5 md:mr-2 w-4 h-4 md:w-5 md:h-5 shrink-0 ${isCreatingOrder ? "animate-spin" : ""}`} />
            <span className="truncate">{isCreatingOrder ? "결제창 준비 중..." : "선택한 테마의 내 별빛 이야기 들어보기"}</span>
            {!isCreatingOrder && <div className="absolute inset-0 bg-white/20 w-full translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
