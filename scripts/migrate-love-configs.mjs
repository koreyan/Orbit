import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = path.join(__dirname, '../data/normalized');

const configFiles = [
  { id: 'charm_assets', filename: 'charm_assets.json', desc: '연애 테마 매력 자산 텍스트 맵핑' },
  { id: 'ideal_types', filename: 'ideal_types.json', desc: '연애 테마 이상형 텍스트 맵핑' },
  { id: 'love_luck', filename: 'love_luck.json', desc: '연애 테마 시기별 운세 및 개운 처방전' },
  { id: 'relationship_problems', filename: 'relationship_problems.json', desc: '연애 테마 관계 문제점 맵핑' },
  { id: 'relationship_styles', filename: 'relationship_styles.json', desc: '연애 테마 연애 성향 맵핑' }
];

async function migrate() {
  console.log("Starting Migration to Supabase z_love_configs...");

  for (const config of configFiles) {
    const filePath = path.join(DATA_DIR, config.filename);
    try {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileData);

      const { error } = await supabase
        .from('z_love_configs')
        .upsert(
          {
            id: config.id,
            config_data: jsonData,
            description: config.desc,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.error(`Failed to upsert ${config.id}:`, error.message);
      } else {
        console.log(`✅ Successfully upserted ${config.id}`);
      }
    } catch (err) {
      console.error(`Error processing ${config.filename}:`, err.message);
    }
  }
  console.log("Migration Complete.");
}

migrate();
