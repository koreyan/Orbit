import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import type { Metadata } from "next";
import { FileText, ChevronRight, LogOut } from "lucide-react";

export const metadata: Metadata = {
  title: "주문조회 - Orbit",
  description: "구매하신 자미두수 분석 리포트를 확인하세요.",
};

import { createClient } from "@/lib/supabase/server";
import ClientDate from "@/components/client-date";

export const dynamic = "force-dynamic";

type ReportRelation = { status: string } | Array<{ status: string }> | null;

interface OrderRow {
  id: string;
  theme: string;
  created_at: string;
  status: string;
  reports: ReportRelation;
}

const THEME_TITLES: Record<string, string> = {
  career: "나의 잠재력과 커리어",
  love: "나만의 매력과 관계",
  hobby: "나를 채우는 여가와 웰니스",
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    redirect("/login");
  }

  // 사용자의 결제 완료된 주문 내역 조회
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      theme,
      created_at,
      status,
      reports (
        id,
        status
      )
    `)
    .eq("user_id", authData.user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#05050a] py-20 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">내 별빛 이야기</h1>
          </div>
          
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </form>
        </div>
        
        <div className="space-y-4">
          {(orders as OrderRow[] | null)?.map((order) => {
            let reportStatus = "pending";
            
            if (order.reports) {
              if (Array.isArray(order.reports)) {
                if (order.reports.length > 0) {
                  reportStatus = order.reports[0].status;
                }
              } else {
                reportStatus = order.reports.status;
              }
            }
              
            const displayStatus = 
              reportStatus === "completed" ? "해석 완료" :
              reportStatus === "generating" ? "해석 중" :
              reportStatus === "failed" ? "오류" : "대기 중";

            return (
              <Link key={order.id} href={`/reports/${order.id}?theme=${order.theme}`}>
                <div className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all group cursor-pointer mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
                        {THEME_TITLES[order.theme] || "나만의 별빛 이야기"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <ClientDate dateString={order.created_at} />
                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                        <span className="truncate max-w-[120px] md:max-w-xs">주문번호: {order.id.split('-')[0]}...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end mt-2 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      reportStatus === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      reportStatus === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {displayStatus}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {(!orders || orders.length === 0) && (
            <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl">
              <p className="text-white/40">아직 해독된 방향성 기록이 없습니다.</p>
              <Link href="/">
                <Button className="mt-4 bg-white/10 hover:bg-white/20 text-white border-none">
                  새로운 명반 생성하기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
