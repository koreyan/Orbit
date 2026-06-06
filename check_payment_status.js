const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const statuses = ['cancelled', 'canceled', 'failed', 'refunded', 'error'];
  for (const s of statuses) {
    const { data, error } = await supabase.from('payments').insert({order_id: 'acac4d08-86c2-4eb8-a545-ac94a98ba8b3', payment_key: 'x', amount: 0, method: 'x', status: s});
    console.log(s, error ? error.message : 'SUCCESS');
  }
}
check();
