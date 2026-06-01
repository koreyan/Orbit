"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "orbit_session";

// 인메모리 로그인 시도 횟수 추적 (E2E 테스트용)
// 실제 환경에서는 Redis 등 캐시 DB를 사용해야 합니다.
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

export async function loginAction(formData: FormData) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  if (!phone || !password) {
    throw new Error("전화번호와 비밀번호를 모두 입력해주세요.");
  }

  // [보안] 브루트포스 방어 로직 시뮬레이션 (메모리 캐시)
  const ip = phone; // 실제로는 headers().get("x-forwarded-for") 등 IP를 사용하지만, 테스트 격리를 위해 phone 사용
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };

  if (attempt.lockUntil > now) {
    const remainMin = Math.ceil((attempt.lockUntil - now) / 60000);
    throw new Error(`비정상적인 로그인 시도가 감지되었습니다. ${remainMin}분 후에 다시 시도해주세요.`);
  }

  // 가입된 전화번호 및 비밀번호 검증 시뮬레이션 (DB 대용)
  // E2E 테스트를 위해 '010-1234-5678' / 'password123' 만 성공으로 처리
  const isValidUser = phone === "010-1234-5678" && password === "password123";

  if (!isValidUser) {
    // 실패 횟수 증가
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.lockUntil = now + 5 * 60 * 1000; // 5분 잠금
      loginAttempts.set(ip, attempt);
      throw new Error("비정상적인 로그인 시도가 감지되었습니다. 5분 후에 다시 시도해주세요.");
    }
    loginAttempts.set(ip, attempt);
    
    // 미가입 번호이거나 비밀번호가 틀린 경우 동일한 에러 메시지를 줘서 유추 불가능하게 처리하는 것이 정석이나,
    // 기획 요구사항에 따라 "일치하는 별빛 이야기가 없습니다" 문구 노출
    throw new Error("일치하는 별빛 이야기가 없습니다. 입력하신 정보를 다시 확인해주세요.");
  }

  // 로그인 성공 시 카운트 초기화
  loginAttempts.delete(ip);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1주일
    path: "/",
  });

  redirect("/reports");
}

export async function autoLoginAction(phone: string) {
  if (!phone) return;
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1주일
    path: "/",
  });
  // 클라이언트에서 호출될 것이므로 redirect 대신 성공 상태만 반환합니다.
  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/");
}
