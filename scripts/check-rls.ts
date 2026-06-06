import { createClient } from '@supabase/supabase-js';

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

async function checkRLS() {
  const { data, error } = await supabaseAnon.from('reports').select('*').limit(1);
  console.log('Anon Query Data:', data);
  console.log('Anon Query Error:', error);
}

checkRLS();
