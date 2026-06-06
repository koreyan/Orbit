import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await adminClient.from('users').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
  console.log('Public Users:', data);
}

main();
