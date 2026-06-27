import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFile(fileName, category) {
  const filePath = path.join(process.cwd(), 'data', 'seed', fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(rawData);
  
  const records = [];
  
  for (const group of jsonData) {
    if (!group.interpretations) continue;
    
    for (const interp of group.interpretations) {
      records.push({
        category: category,
        target_subject: interp.target_subject,
        teaser_quote: interp.teaser_quote || null,
        core_trait: interp.core_trait || null,
        career_insight: interp.career_insight || null,
        love_insight: interp.love_insight || null,
        wellness_insight: interp.wellness_insight || null,
        periodic_insight: interp.periodic_insight || null
      });
    }
  }
  
  if (records.length === 0) {
    console.log(`No interpretations found in ${fileName}`);
    return;
  }
  
  console.log(`Inserting ${records.length} records from ${fileName} into category '${category}'...`);
  
  const { error } = await supabase
    .from('z_knowledge_base')
    .insert(records);
    
  if (error) {
    console.error(`Error inserting ${fileName}:`, error.message);
  } else {
    console.log(`Successfully seeded ${fileName}.`);
  }
}

async function main() {
  await seedFile('seed_stars.json', 'star');
  await seedFile('seed_palaces.json', 'palace');
  await seedFile('seed_formations.json', 'formation');
  console.log("Seeding complete.");
}

main();
