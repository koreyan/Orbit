import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data: reports, error } = await adminClient
    .from('reports')
    .select('*')
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching reports:', error);
    process.exit(1);
  }

  let fixedCount = 0;

  for (const report of reports) {
    if (!report.content) continue;
    let modified = false;
    const content = report.content;

    for (const key of ["teaser_quote", "core_trait", "theme_insight", "periodic_insight"]) {
      if (content[key] && typeof content[key] === "object") {
        content[key] = Object.values(content[key]).join("\n\n");
        modified = true;
      }
    }

    if (modified) {
      console.log(`Fixing report ${report.id}...`);
      const { error: updateError } = await adminClient
        .from('reports')
        .update({ content })
        .eq('id', report.id);
      
      if (updateError) {
        console.error(`Failed to update report ${report.id}:`, updateError);
      } else {
        fixedCount++;
      }
    }
  }

  console.log(`Successfully fixed ${fixedCount} corrupted reports.`);
}

main();
