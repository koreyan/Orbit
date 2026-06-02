import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const minorStars = ['영성', '녹존'];

for (const star of minorStars) {
  const { data } = await supabase.from('z_knowledge_base').select('target_subject').ilike('target_subject', `%${star}%`);
  console.log(`${star}: ${data.length > 0 ? 'Found ' + data.length : 'Not Found'}`);
}
