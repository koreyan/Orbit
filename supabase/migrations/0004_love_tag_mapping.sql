CREATE TABLE IF NOT EXISTS public.z_love_tag_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id UUID NOT NULL REFERENCES public.z_knowledge_base(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (knowledge_base_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_z_love_tag_mapping_knowledge_base_id
    ON public.z_love_tag_mapping (knowledge_base_id);

CREATE INDEX IF NOT EXISTS idx_z_love_tag_mapping_tag
    ON public.z_love_tag_mapping (tag);

ALTER TABLE public.z_love_tag_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.z_love_tag_mapping;
CREATE POLICY "Enable read access for all users" ON public.z_love_tag_mapping
FOR SELECT USING (true);
