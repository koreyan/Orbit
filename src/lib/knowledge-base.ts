import { SupabaseClient } from '@supabase/supabase-js';

export interface KnowledgeBaseEntry {
  target_subject: string;
  core_trait: string;
  career_insight: string;
  love_insight: string;
  wellness_insight: string;
  periodic_insight: string;
}

export interface KnowledgeBaseContextEntry extends KnowledgeBaseEntry {
  category: 'star' | 'palace' | 'formation';
  matched_term: string;
}

const KNOWLEDGE_BASE_SELECT_FIELDS = 'target_subject, core_trait, career_insight, love_insight, wellness_insight, periodic_insight' as const;

export async function fetchKnowledgeBaseByTerms(
  supabase: SupabaseClient,
  category: 'star' | 'palace' | 'formation',
  terms: string[]
): Promise<KnowledgeBaseContextEntry[]> {
  const collected: KnowledgeBaseContextEntry[] = [];
  const seenSubjects = new Set<string>();

  for (const term of terms) {
    const normalizedTerm = term.trim();
    if (!normalizedTerm) continue;

    const { data, error } = await supabase
      .from('z_knowledge_base')
      .select(KNOWLEDGE_BASE_SELECT_FIELDS)
      .eq('category', category)
      .ilike('target_subject', `%${normalizedTerm}%`);

    if (error) {
      console.warn(`Error fetching knowledge base for ${category}:${normalizedTerm}:`, error.message);
      continue;
    }

    if (!data || data.length === 0) continue;

    const sortedMatches = category === 'star'
      ? [...data].sort((left, right) => {
          const leftExact = left.target_subject.startsWith(`${normalizedTerm}성`);
          const rightExact = right.target_subject.startsWith(`${normalizedTerm}성`);
          if (leftExact === rightExact) return left.target_subject.localeCompare(right.target_subject);
          return leftExact ? -1 : 1;
        })
      : [...data].sort((left, right) => left.target_subject.localeCompare(right.target_subject));

    for (const item of sortedMatches) {
      if (seenSubjects.has(item.target_subject)) continue;
      seenSubjects.add(item.target_subject);
      collected.push({
        ...item,
        category,
        matched_term: normalizedTerm,
      });
      break;
    }
  }

  return collected;
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
      .select(KNOWLEDGE_BASE_SELECT_FIELDS)
      .eq('category', 'star')
      .ilike('target_subject', `%${starName}%`);

    if (error) {
      console.warn(`Error fetching knowledge base for ${starName}:`, error.message);
      continue;
    }

    if (data && data.length > 0) {
      // 해당 주성 이름으로 정확히 시작하는 항목을 최우선으로 찾음 ('천상성' 등 보조성 혼동 방지)
      const exactMatch = data.find((d) => d.target_subject.startsWith(`${starName}성`)) || data[0];
      result[starName] = exactMatch;
    }
  }

  return result;
}

