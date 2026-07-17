"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

import { MyeongbanGrid } from "@/components/myeongban/myeongban-grid";
import { Button } from "@/components/ui/button";
import type { ResultInterpretation, ZiweiChart } from "@/lib/ziwei-types";

interface ReportMyeongbanSectionProps {
  chartData: ZiweiChart;
  interpretation: ResultInterpretation;
}

export const ReportMyeongbanSection = ({ chartData, interpretation }: ReportMyeongbanSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = "report-owner-myeongban";

  return (
    <section className="mx-auto mb-8 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-xs font-bold text-orange-100">
            <Sparkles className="h-3.5 w-3.5 text-orange-300" />
            내 명반
          </div>
          <h2 className="text-2xl font-black text-white">리포트의 기준이 된 명반</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">이 영역은 리포트 소유자에게만 표시됩니다.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((current) => !current)}
          className="min-h-11 border-white/15 bg-white/5 text-white hover:bg-white/10"
        >
          {isOpen ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              명반 접기
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              내 명반 보기
            </>
          )}
        </Button>
      </div>

      {isOpen && (
        <div id={contentId}>
          <MyeongbanGrid chartData={chartData} interpretation={interpretation} />
        </div>
      )}
    </section>
  );
};
