"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// 인메모리 로그인 시도 횟수 추적 (E2E 테스트용)
// 실제 환경에서는 Redis 등 캐시 DB를 사용해야 합니다.
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

export async function loginAction(formData: FormData) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  if (!phone || !password) {
    return { success: false, error: "전화번호와 비밀번호를 모두 입력해주세요." };
  }

  // [보안] 브루트포스 방어 로직 시뮬레이션 (메모리 캐시)
  const ip = phone; // 테스트 격리를 위해 phone 번호 자체를 키로 사용
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };

  if (attempt.lockUntil > now) {
    const remainMin = Math.ceil((attempt.lockUntil - now) / 60000);
    return { success: false, error: `비정상적인 로그인 시도가 감지되었습니다. ${remainMin}분 후에 다시 시도해주세요.` };
  }

  const supabase = await createClient();

  // order.ts의 가입 방식과 동일하게 매핑
  const dummyEmail = `u${phone.replace(/[^0-9]/g, '')}@orbit-app.com`;
  const paddedPassword = `${password}_orbit`;

  const { error } = await supabase.auth.signInWithPassword({
    email: dummyEmail,
    password: paddedPassword,
  });

  if (error) {
    // 실패 횟수 증가
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.lockUntil = now + 5 * 60 * 1000; // 5분 잠금
      loginAttempts.set(ip, attempt);
      return { success: false, error: "비정상적인 로그인 시도가 감지되었습니다. 5분 후에 다시 시도해주세요." };
    }
    loginAttempts.set(ip, attempt);
    
    return { success: false, error: "일치하는 별빛 이야기가 없습니다. 입력하신 정보를 다시 확인해주세요." };
  }

  // 로그인 성공 시 카운트 초기화
  loginAttempts.delete(ip);

  return { success: true };
}

export async function autoLoginAction(phone: string) {
  // 추후 주문(Order) 액션 내에서 supabase.auth.signUp()을 호출하면
  // 자동으로 쿠키가 셋팅되므로, 기존 임시 autoLoginAction의 쿠키 수동 설정 로직은 제거합니다.
  if (!phone) return;
  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function adminLoginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("관리자 이메일과 비밀번호를 모두 입력해주세요.");
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.user) {
    throw new Error("관리자 로그인에 실패했습니다.");
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (userError || userData?.role !== 'admin') {
    await supabase.auth.signOut();
    throw new Error("관리자 권한이 없습니다.");
  }

  redirect("/admin");
}
