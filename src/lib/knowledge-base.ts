import { SupabaseClient } from '@supabase/supabase-js';

export interface KnowledgeBaseEntry {
  target_subject: string;
  core_trait: string;
  career_insight: string;
  love_insight: string;
  wellness_insight: string;
  periodic_insight: string;
}

export async function fetchKnowledgeBaseForStars(
  supabase: SupabaseClient,
  stars: string[]
): Promise<Record<string, KnowledgeBaseEntry>> {
  const result: Record<string, KnowledgeBaseEntry> = {};

  for (const starName of stars) {
    if (!starName) continue;

    const { data, error } = await supabase
      .from('z_knowledge_base')
      .select('target_subject, core_trait, career_insight, love_insight, wellness_insight, periodic_insight')
      .eq('category', 'star')
      .ilike('target_subject', `%${starName}%`);

    if (error) {
      console.warn(`Error fetching knowledge base for ${starName}:`, error.message);
      continue;
    }

    if (data && data.length > 0) {
      // 해당 주성 이름으로 정확히 시작하는 항목을 최우선으로 찾음 ('천상성' 등 보조성 혼동 방지)
      const exactMatch = data.find(d => d.target_subject.startsWith(`${starName}성`)) || data[0];
      result[starName] = exactMatch;
    }
  }

  return result;
}
