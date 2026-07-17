import { translateZiwei } from "@/lib/ziwei-translator";
import { MAJOR_STARS, LUCKY_STARS, UNLUCKY_STARS } from "@/lib/ziwei-extractor";
import type { LiunianData, ResultInterpretation, ZiweiChart } from "@/lib/ziwei-types";

const GRID_LAYOUT = [
  ["巳", "午", "未", "申"],
  ["辰", null, null, "酉"],
  ["卯", null, null, "戌"],
  ["寅", "丑", "子", "亥"],
];

interface MyeongbanGridProps {
  chartData: ZiweiChart;
  interpretation: ResultInterpretation;
  activeLiunian?: LiunianData | null;
}

export const MyeongbanGrid = ({ chartData, interpretation, activeLiunian }: MyeongbanGridProps) => {
  return (
    <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/10 p-4 md:p-6 shadow-2xl relative overflow-hidden">
      <div className="grid grid-cols-4 grid-rows-4 gap-2 md:gap-3 aspect-square max-w-2xl mx-auto select-none">
        {GRID_LAYOUT.flat().map((zhi, idx) => {
          if (!zhi) {
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

          const palace = chartData.palaces[Object.keys(chartData.palaces).find((key) => chartData.palaces[key].zhi === zhi) as string];
          if (!palace) return <div key={idx} className="aspect-square hidden md:block" />;

          const isLifePalace = palace.name === "命宮";
          const isMigrationPalace = palace.name === "遷移宮";
          const isLifeOrMigration = isLifePalace || (interpretation.borrowed && isMigrationPalace);
          const isDaHanMing = activeLiunian && palace.name === activeLiunian.daxianPalaceName;
          const isLiuNianMing = activeLiunian && palace.name === activeLiunian.natalPalaceAtMing;

          return (
            <div
              key={idx}
              className={`
                relative aspect-square flex flex-col p-1 md:p-3 rounded-xl md:rounded-2xl
                bg-white/[0.02] backdrop-blur-sm transition-all duration-300
                ${isLiuNianMing ? "border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-10 scale-[1.02]" :
                  isDaHanMing ? "border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] z-10 scale-[1.02]" :
                    isLifeOrMigration ? "border-2 border-primary shadow-[0_0_15px_rgba(217,70,239,0.2)] z-10 scale-[1.02]" : "border border-white/10"}
              `}
            >
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
                <div className="flex flex-col gap-0.5 md:gap-1">
                  {palace.stars.filter((star) => MAJOR_STARS.includes(star.name)).map((star, starIndex: number) => (
                    <span key={`m-${starIndex}`} className="text-[10px] md:text-sm font-bold text-amber-400 leading-tight flex flex-wrap items-center">
                      {translateZiwei(star.name)}
                      {star.siHua && <span className="text-[8px] md:text-[10px] bg-white/20 text-white rounded px-0.5 md:px-1 ml-0.5 md:ml-1">[{translateZiwei(star.siHua)}]</span>}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                  {palace.stars.filter((star) => LUCKY_STARS.includes(star.name)).map((star, starIndex: number) => (
                    <span key={`l-${starIndex}`} className="text-[8px] md:text-xs font-semibold text-emerald-400 leading-none flex items-center">
                      {translateZiwei(star.name)}
                      {star.siHua && <span className="text-[7px] md:text-[9px] bg-white/20 text-white rounded px-0.5 md:px-1 ml-0.5">[{translateZiwei(star.siHua)}]</span>}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                  {palace.stars.filter((star) => UNLUCKY_STARS.includes(star.name)).map((star, starIndex: number) => (
                    <span key={`u-${starIndex}`} className="text-[8px] md:text-xs font-semibold text-rose-400 leading-none flex items-center">
                      {translateZiwei(star.name)}
                      {star.siHua && <span className="text-[7px] md:text-[9px] bg-white/20 text-white rounded px-0.5 md:px-1 ml-0.5">[{translateZiwei(star.siHua)}]</span>}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex items-end justify-between w-full border-t border-white/5 pt-0.5 md:pt-1 shrink-0">
                <span className="text-[8px] md:text-[10px] text-white/40 leading-none">{translateZiwei(palace.ganZhi)}</span>
                <span className={`text-[9px] md:text-sm font-black leading-none ${isLifeOrMigration ? "text-primary" : "text-white/80"}`}>
                  {translateZiwei(palace.name)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
