const requireServerEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
  }

  return value;
};

export const getSupabaseUrl = (): string => requireServerEnv("NEXT_PUBLIC_SUPABASE_URL");
export const getSupabaseAnonKey = (): string => requireServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const getSupabaseServiceRoleKey = (): string => requireServerEnv("SUPABASE_SERVICE_ROLE_KEY");
export const getTossSecretKey = (): string => requireServerEnv("TOSS_SECRET_KEY");
export const getOpenAiApiKey = (): string => requireServerEnv("OPENAI_API_KEY");
