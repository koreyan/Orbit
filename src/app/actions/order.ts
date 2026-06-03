"use server";

import { createClient } from "@/lib/supabase/server";
import { createChart } from "@orrery/core/ziwei";
import { extractMainStars } from "@/lib/ziwei-extractor";

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
    // 계속 진행합니다. (에러 발생 시 백그라운드나 리포트 조회 시 재시도 할 수 있도록)
  }

  const enrichedSajuData = {
    ...saju_data,
    extracted_stars: extractedStars
  };

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
        if (signUpError.message.includes("already been registered") || signUpError.message.includes("already registered") || signUpError.message.includes("Email exists")) {
          // 신규 유저가 아니며 비밀번호가 틀린 경우: 입력된 새 비밀번호로 덮어씁니다.
          
          // 이메일을 통해 기존 유저의 ID를 확실하게 찾기 위해 generateLink 활용 (public.users의 phone_number가 unknown일 수 있음)
          const { data: linkData } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: dummyEmail
          });
          
          const existingUserId = linkData?.user?.id;
          
          if (existingUserId) {
            // 비밀번호 강제 갱신
            await adminClient.auth.admin.updateUserById(existingUserId, { password: defaultPassword });
            
            // 갱신된 비밀번호로 다시 로그인 시도
            const { data: retrySignInData, error: retryError } = await supabase.auth.signInWithPassword({
              email: dummyEmail,
              password: defaultPassword,
            });

            if (retryError) {
              throw new Error(`비밀번호 갱신 후 로그인 실패: ${retryError.message}`);
            }
            
            if (retrySignInData.user) {
              userId = retrySignInData.user.id;
            }
          } else {
            throw new Error("유저 정보를 찾을 수 없습니다.");
          }
        } else {
          throw new Error(`회원가입 실패: ${signUpError.message}`);
        }
      } else {
        // 회원가입 성공 시 로그인 처리
        await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: defaultPassword,
        });
        
        if (signUpData.user) {
          userId = signUpData.user.id;
        }
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
