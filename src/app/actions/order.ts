"use server";

import { createClient } from "@/lib/supabase/server";

export async function createOrderAction(params: {
  phone: string;
  password?: string;
  saju_data: any;
  theme: string;
  amount: number;
}) {
  const { phone, password, saju_data, theme, amount } = params;

  if (!phone) {
    throw new Error("전화번호가 필요합니다.");
  }

  const supabase = await createClient();
  
  // 가상 이메일 생성 (Supabase 이메일 유효성 검사 통과를 위해 알파벳 접두사 추가)
  const dummyEmail = `u${phone.replace(/[^0-9]/g, '')}@orbit-app.com`;
  // Supabase Auth 최소 6자리 요구사항을 우회하기 위한 패딩
  const defaultPassword = password ? `${password}_orbit` : "orbit1234!";

  // 1. 유저 인증 처리 (로그인 시도)
  let userId = null;

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: dummyEmail,
    password: defaultPassword,
  });

  if (signInError) {
    if (signInError.message.includes("Invalid login credentials")) {
      // 신규 유저일 수 있으므로 회원가입 시도
      // 이메일 인증(Email Confirmation) 단계를 우회하기 위해 관리자 권한으로 유저 생성
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: signUpData, error: signUpError } = await adminClient.auth.admin.createUser({
        email: dummyEmail,
        password: defaultPassword,
        email_confirm: true, // 이메일 인증 생략
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("Email exists")) {
          throw new Error("이미 등록된 번호입니다. 비밀번호를 다시 확인해주세요.");
        }
        throw new Error(`회원가입 실패: ${signUpError.message}`);
      }

      // 생성 직후 로그인 처리하여 쿠키 세션 발급
      await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: defaultPassword,
      });
      
      if (signUpData.user) {
        userId = signUpData.user.id;
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

  // 2. 주문서 생성 (pending 상태)
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      saju_data,
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

export async function getOrderAction(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    throw new Error(`주문 조회 실패: ${error.message}`);
  }

  return data;
}
