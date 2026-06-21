import { createClient } from "@/lib/supabase/server";

/**
 * 서버 환경에서 관리자(Admin) 권한을 안전하게 검증하는 함수입니다.
 * 유저 인증 정보 및 'users' 테이블의 role 값을 확인합니다.
 * 권한이 없을 경우 에러를 발생시킵니다.
 */
export async function verifyAdmin() {
  const supabase = await createClient();

  // 현재 유저 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: 로그인 후 이용해주세요.");
  }

  // users 테이블에서 역할(role) 확인
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || userData?.role !== 'admin') {
    throw new Error("Forbidden: 관리자 권한이 필요합니다.");
  }

  return user;
}
