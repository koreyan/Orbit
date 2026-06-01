import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { StarBackground } from "@/components/ui/star-background";
import ReportContent from "./ReportContent";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ "report-id": string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("orbit_session");

  // 1. 로그아웃 상태 접근 차단
  if (!session?.value) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const reportId = resolvedParams["report-id"];
  const theme = (resolvedSearchParams.theme as string) || "career";

  // 2. 타인 리포트 접근 차단 (권한 검증 시뮬레이션)
  // DB가 없으므로 임시로 본인의 주문번호(ORDER_1700000001)가 아닌 경우 403 에러 렌더링
  const isAuthorized = reportId === "ORDER_1700000001";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4">
        <div className="text-center bg-white/[0.02] border border-red-500/20 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">권한이 없습니다</h1>
          <p className="text-white/60 mb-8">요청하신 별빛 이야기 리포트에 접근할 수 있는 권한이 없거나, 존재하지 않는 리포트입니다.</p>
          <Link href="/reports">
            <Button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white border-none rounded-xl">
              내 보관함으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 pb-12 px-4 overflow-hidden bg-[#05050a]">
      <StarBackground />
      <BackButton />
      
      <div className="relative z-10 w-full">
        <ReportContent reportId={reportId} theme={theme} />
      </div>
    </div>
  );
}
