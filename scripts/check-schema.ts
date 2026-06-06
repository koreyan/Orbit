import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkSchema() {
  const { data, error } = await supabaseAdmin.from('reports').select('*').limit(1);
  console.log('Reports sample:', data);
  console.log('Error:', error);
}

checkSchema();
