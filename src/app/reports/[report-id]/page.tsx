import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { StarBackground } from "@/components/ui/star-background";
import ReportContent from "./ReportContent";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ "report-id": string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  // 1. 로그아웃 상태 접근 차단
  if (authError || !authData?.user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const reportId = resolvedParams["report-id"];
  const theme = (resolvedSearchParams.theme as string) || "career";

  // 2. Report 정보 조회 (reportId는 실제로는 orderId로 넘어옴)
  const orderId = reportId;
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("*")
    .eq("order_id", orderId)
    .single();

  // 타인 리포트 접근 차단 로직 (order를 조회해서 user_id 검증해야 함)
  const { data: order } = await supabase
    .from("orders")
    .select("user_id, theme")
    .eq("id", orderId)
    .single();

  const isAuthorized = order && order.user_id === authData.user.id;
  const actualTheme = order?.theme || theme;

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

  const reportStatus = report ? report.status : "pending";
  const reportContent = report?.content || null;

  return (
    <div className="relative min-h-screen pt-24 pb-12 px-4 overflow-hidden bg-[#05050a]">
      <StarBackground />
      <BackButton />
      
      <div className="relative z-10 w-full">
        <ReportContent 
          reportId={orderId} 
          theme={actualTheme} 
          status={reportStatus}
          content={reportContent}
        />
      </div>
    </div>
  );
}
