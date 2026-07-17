import type { FullConfig } from '@playwright/test';

const DB_WRITE_SPEC_PATTERN = /backend-|payment|checkout|report|admin|login/i;

const getProjectRef = (url: string): string | null => {
  const match = url.match(/^https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
};

async function globalSetup(config: FullConfig) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const expectedTestProjectRef = process.env.E2E_SUPABASE_PROJECT_REF;
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const selectedTestFiles = config.projects.flatMap((project) => project.testMatch ?? []);
  const mayRunDbWriteSpecs = selectedTestFiles.some((value) => DB_WRITE_SPEC_PATTERN.test(String(value))) || hasServiceRole;

  if (!mayRunDbWriteSpecs || !supabaseUrl) {
    return;
  }

  if (!expectedTestProjectRef) {
    throw new Error('E2E_SUPABASE_PROJECT_REF가 설정되지 않아 DB 쓰기 가능 E2E를 중단합니다. .env.test.local의 테스트 Supabase 프로젝트 ref를 지정해주세요.');
  }

  const actualProjectRef = getProjectRef(supabaseUrl);

  if (actualProjectRef !== expectedTestProjectRef) {
    throw new Error(`E2E Supabase 프로젝트 불일치: expected=${expectedTestProjectRef}, actual=${actualProjectRef ?? 'unknown'}. 데모/운영 DB 보호를 위해 중단합니다.`);
  }
}

export default globalSetup;
