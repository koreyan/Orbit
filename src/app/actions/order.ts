"use server";

import { createClient } from "@/lib/supabase/server";
import { createChart } from "@orrery/core/ziwei";
import { extractMainStars } from "@/lib/ziwei-extractor";

export async function createAnonymousOrderAction(params: {
  saju_data: any;
  theme: string;
  amount: number;
}) {
  const { saju_data, theme, amount } = params;

  // 1차 명반 계산 및 추출 (JSON 형태로 DB 보관)
  let extractedStars = null;
  try {
    const { date, time, gender } = saju_data;
    if (date && time && gender) {
      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute] = time.split(":").map(Number);
      const isMale = gender === "M";
      const chartData = createChart(year, month, day, hour, minute, isMale);
      extractedStars = extractMainStars(chartData);
    }
  } catch (err) {
    console.error("Failed to extract stars during order creation:", err);
  }

  const enrichedSajuData = {
    ...saju_data,
    extracted_stars: extractedStars
  };

  // RLS(Row Level Security) 정책 우회를 위해 adminClient 사용
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 유저 정보 없이 주문서 생성 (pending 상태)
  const { data: orderData, error: orderError } = await adminClient
    .from("orders")
    .insert({
      user_id: null, // 익명 주문
      saju_data: enrichedSajuData,
      theme,
      amount,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError) {
    throw new Error(`주문 생성 실패: ${orderError.message}`);
  }

  return { orderId: orderData.id };
}

export async function linkUserToOrderAction(params: {
  orderId: string;
  phone: string;
  password?: string;
}) {
  const { orderId, phone, password } = params;

  if (!phone || !orderId) {
    throw new Error("주문 ID와 전화번호가 필요합니다.");
  }

  const supabase = await createClient();
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // 주문이 결제 완료 상태인지 확인
  const { data: orderData, error: orderError } = await adminClient
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();
    
  if (orderError || !orderData) {
    throw new Error("주문 정보를 찾을 수 없습니다.");
  }
  
  if (orderData.status !== "paid") {
    throw new Error("결제가 완료되지 않은 주문입니다.");
  }

  // 가상 이메일 생성
  const dummyEmail = `u${phone.replace(/[^0-9]/g, '')}@orbit-app.com`;
  const defaultPassword = password ? `${password}_orbit` : "orbit1234!";

  let userId = null;

  // 1. 로그인 시도
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: dummyEmail,
    password: defaultPassword,
  });

  if (signInError) {
    if (signInError.message.includes("Invalid login credentials")) {
      // 회원가입 시도
      const { data: signUpData, error: signUpError } = await adminClient.auth.admin.createUser({
        email: dummyEmail,
        password: defaultPassword,
        email_confirm: true,
      });

      if (signUpError) {
        if (signUpError.message.includes("already been registered") || signUpError.message.includes("already registered") || signUpError.message.includes("Email exists")) {
          // 비밀번호 덮어쓰기 (기존 유저)
          const { data: linkData } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: dummyEmail
          });
          
          const existingUserId = linkData?.user?.id;
          
          if (existingUserId) {
            await adminClient.auth.admin.updateUserById(existingUserId, { password: defaultPassword });
            
            const { data: retrySignInData, error: retryError } = await supabase.auth.signInWithPassword({
              email: dummyEmail,
              password: defaultPassword,
            });

            if (retryError) throw new Error(`비밀번호 갱신 후 로그인 실패: ${retryError.message}`);
            if (retrySignInData.user) userId = retrySignInData.user.id;
          } else {
            throw new Error("유저 정보를 찾을 수 없습니다.");
          }
        } else {
          throw new Error(`회원가입 실패: ${signUpError.message}`);
        }
      } else {
        await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: defaultPassword,
        });
        if (signUpData.user) userId = signUpData.user.id;
      }
    } else {
      throw new Error(`로그인 실패: ${signInError.message}`);
    }
  } else if (signInData.user) {
    userId = signInData.user.id;
  }

  if (!userId) {
    throw new Error("유저 인증 정보를 가져오지 못했습니다.");
  }

  // 2. 주문서 업데이트 (user_id 귀속)
  const { error: updateError } = await adminClient
    .from("orders")
    .update({ user_id: userId })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(`주문에 유저 정보 연동 실패: ${updateError.message}`);
  }

  return { success: true, userId };
}

export async function getOrderAction(orderId: string) {
  // RLS 우회를 위해 adminClient 사용 (익명 가주문 조회를 위해)
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await adminClient
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    throw new Error(`주문 조회 실패: ${error.message}`);
  }

  return data;
}
