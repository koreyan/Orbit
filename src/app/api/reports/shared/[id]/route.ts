import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // 공유 리포트는 인증이 필요 없지만, is_public 필드가 true여야 합니다.
  
  const { data: report, error } = await supabase
    .from("reports")
    .select("*, orders(theme)")
    .eq("id", id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!report.is_public) {
    return NextResponse.json({ error: "비공개 리포트입니다." }, { status: 403 });
  }

  if (report.status !== "completed") {
    return NextResponse.json({ error: "아직 생성 중인 리포트입니다." }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: report.id,
      content: report.content,
      generated_at: report.generated_at,
      theme: report.orders?.theme
    }
  });
}
