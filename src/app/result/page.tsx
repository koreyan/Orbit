import { redirect } from "next/navigation";
import ResultClient from "./ResultClient";
import { StarBackground } from "@/components/ui/star-background";
import { createChart } from "@orrery/core/ziwei";
import { BackButton } from "@/components/ui/back-button";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function ResultPage(props: Props) {
  const searchParams = await props.searchParams;
  
  const dateStr = searchParams.date as string;
  const timeStr = searchParams.time as string;
  const genderStr = searchParams.gender as string;
  const locationStr = searchParams.location as string;
  
  if (!dateStr || !timeStr || !genderStr) {
    redirect("/");
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const isMale = genderStr === "M";

  // @orrery/core 패키지를 사용해 서버에서 자미두수 명반 렌더링용 데이터 생성
  let chartData;
  try {
    chartData = createChart(year, month, day, hour, minute, isMale);
  } catch (error) {
    console.error("Failed to generate Ziwei chart:", error);
    redirect("/");
  }

  return (
    <div className="relative min-h-screen pt-24 pb-12 px-4 overflow-hidden">
      <StarBackground />
      <BackButton />
      
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
            별빛이 그려낸 나의 진짜 모습
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            당신만의 고유한 성향을 해독했습니다. 집중적으로 알아보고 싶은 '나 활용법' 테마를 선택해 주세요.
          </p>
        </div>

        {/* 클라이언트 컴포넌트로 차트 데이터 전달 */}
        <ResultClient chartData={chartData} params={{ date: dateStr, time: timeStr, gender: genderStr, location: locationStr }} />
      </div>
    </div>
  );
}
