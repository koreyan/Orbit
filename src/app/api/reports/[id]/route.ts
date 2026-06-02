import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  // URL의 id가 order_id일 수도 있고 report_id일 수도 있으므로 둘 다 확인합니다.
  // 프론트엔드에서는 주로 order_id를 /reports/[id] 로 사용하고 있습니다.
  
  let reportData = null;

  // 1. order_id로 조회 시도
  const { data: reportByOrderId, error: orderIdError } = await supabase
    .from("reports")
    .select("*, orders(user_id, theme, amount)")
    .eq("order_id", id)
    .single();

  if (!orderIdError && reportByOrderId) {
    reportData = reportByOrderId;
  } else {
    // 2. report.id로 조회 시도
    const { data: reportById, error: reportIdError } = await supabase
      .from("reports")
      .select("*, orders(user_id, theme, amount)")
      .eq("id", id)
      .single();

    if (!reportIdError && reportById) {
      reportData = reportById;
    }
  }

  if (!reportData) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 });
  }

  // 권한 검증: 본인의 리포트인지 확인
  const isAuthorized = reportData.orders?.user_id === authData.user.id;
  
  if (!isAuthorized) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: reportData.id,
      order_id: reportData.order_id,
      content: reportData.content,
      status: reportData.status,
      is_public: reportData.is_public,
      generated_at: reportData.generated_at,
      theme: reportData.orders?.theme
    }
  });
}
