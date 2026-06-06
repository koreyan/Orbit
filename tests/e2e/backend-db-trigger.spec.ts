import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

test.describe('DB & Schema: Auth User Sync Trigger E2E', () => {
  let createdUserId: string;
  let testEmail: string;
  let testPhone: string;

  test.beforeAll(async () => {
    // Generate unique user info
    const uniqueSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    testPhone = `010${uniqueSuffix}`;
    testEmail = `u${testPhone}@orbit-app.com`;

    // Ensure no conflict
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const existingUser = usersData.users.find(u => u.email === testEmail);
    if (existingUser) {
      await adminClient.auth.admin.deleteUser(existingUser.id);
    }
  });

  test.afterAll(async () => {
    if (createdUserId) {
      await adminClient.auth.admin.deleteUser(createdUserId);
    }
    // Also delete from public.users to keep it clean
    if (createdUserId) {
      await adminClient.from('users').delete().eq('id', createdUserId);
    }
  });

  test('신규 유저 가입 시 public.users 에 자동으로 동기화되어야 한다', async () => {
    // 1. Create user in auth.users
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'trigger_test_password',
      email_confirm: true,
      user_metadata: { phone_number: testPhone }
    });

    expect(authErr).toBeNull();
    expect(authData?.user?.id).toBeDefined();

    createdUserId = authData.user!.id;

    // 트리거가 백그라운드에서 동작할 수 있으므로 약간의 대기 (보통 즉시 실행됨)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Check public.users
    const { data: publicUser, error: publicErr } = await adminClient
      .from('users')
      .select('*')
      .eq('id', createdUserId)
      .single();

    expect(publicErr).toBeNull();
    expect(publicUser).toBeDefined();

    // 3. Verify fields
    expect(publicUser.id).toBe(createdUserId);
    expect(publicUser.phone_number).toBe(testPhone);
    expect(publicUser.role).toBe('user');
  });
});
