import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const minorStars = ['좌보', '우필', '문창', '문곡', '천괴', '천월', '록존', '천마', '화성', '령성', '경양', '타라', '지공', '지겁'];
const sihua = ['화록', '화권', '화과', '화기'];

for (const star of [...minorStars, ...sihua]) {
  const { data } = await supabase.from('z_knowledge_base').select('target_subject').ilike('target_subject', `%${star}%`);
  console.log(`${star}: ${data.length > 0 ? 'Found ' + data.length : 'Not Found'}`);
}
