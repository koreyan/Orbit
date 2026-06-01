import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env and .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

// Initialize Supabase client with Service Role Key to bypass RLS for seeding
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SEED_DIR = path.join(__dirname, '..', 'data', 'seed');

async function seedCategory(fileName: string, categoryName: string) {
  const filePath = path.join(SEED_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ ${fileName} not found. Skipping...`);
    return;
  }

  console.log(`\n📦 Seeding ${categoryName} from ${fileName}...`);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const parsedData = JSON.parse(rawData);

  const insertData = [];

  for (const post of parsedData) {
    if (!post.interpretations) continue;
    for (const interpretation of post.interpretations) {
      insertData.push({
        category: categoryName,
        target_subject: interpretation.target_subject || post.source_title,
        core_trait: interpretation.core_trait,
        career_insight: interpretation.career_insight,
        love_insight: interpretation.love_insight,
        wellness_insight: interpretation.wellness_insight,
        periodic_insight: interpretation.periodic_insight,
      });
    }
  }

  console.log(`Prepared ${insertData.length} records for ${categoryName}. Inserting into Supabase...`);

  // Supabase bulk insert
  const { data, error } = await supabase
    .from('z_knowledge_base')
    .insert(insertData)
    .select();

  if (error) {
    console.error(`❌ Error inserting ${categoryName}:`, error.message, error.details);
  } else {
    console.log(`✅ Successfully inserted ${data.length} records for ${categoryName}!`);
  }
}

async function main() {
  console.log('🚀 Starting Database Seeding Process...');

  await seedCategory('seed_stars.json', 'star');
  await seedCategory('seed_palaces.json', 'palace');
  await seedCategory('seed_formations.json', 'formation');

  console.log('\n🎉 All seeding tasks completed!');
}

main().catch(console.error);
