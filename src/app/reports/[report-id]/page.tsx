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
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const reportId = resolvedParams["report-id"];
  const theme = (resolvedSearchParams.theme as string) || "career";

  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const orderId = reportId;

  // 1. 일반 클라이언트로 권한 체크 및 리포트 조회 (RLS 적용)
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (!report) {
    // 2. 권한이 없어서 안보이는 건지 진짜 없는 건지 확인 (Admin 우회)
    const { data: realReport } = await adminClient
      .from("reports")
      .select("is_public")
      .eq("order_id", orderId)
      .single();

    if (realReport) {
      // 데이터는 존재하지만 RLS에 의해 막힘 = 권한 없는 타인 접근
      redirect("/reports/forbidden");
    }
  }

  // 3. 리포트 열람 권한을 통과했다면, 테마 정보는 Admin으로 가져옴 
  // (orders 테이블 RLS 무한참조를 끊기 위한 안전망)
  const { data: order } = await adminClient
    .from("orders")
    .select("theme")
    .eq("id", orderId)
    .single();

  if (!order) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4">
        <div className="text-center bg-white/[0.02] border border-red-500/20 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">존재하지 않는 리포트입니다</h1>
          <p className="text-white/60 mb-8">요청하신 별빛 이야기 리포트를 찾을 수 없습니다. 주소를 다시 확인해주세요.</p>
          <Link href="/reports">
            <Button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white border-none rounded-xl">
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const actualTheme = order?.theme || theme;

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
