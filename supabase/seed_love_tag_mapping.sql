begin;

insert into public.z_love_tag_mapping (knowledge_base_id, tag)
select id, 'attraction_pattern'
from public.z_knowledge_base
where (
  category = 'star'
  and target_subject in (
    '자미성(紫微星)',
    '천동성(天同星)',
    '천상성 (天相星)',
    '천부성(天府星)',
    '자미두수 도화성 (桃花星)',
    '자미두수 도화성(桃花星) 총론'
  )
)
or (
  category = 'formation'
  and (
    target_subject ilike '%도화%'
    or target_subject ilike '%홍란%'
    or target_subject ilike '%천희%'
    or target_subject ilike '%함지%'
    or target_subject ilike '%인맥형 도화%'
    or target_subject ilike '%감정형 도화%'
  )
)
on conflict do nothing;

insert into public.z_love_tag_mapping (knowledge_base_id, tag)
select id, 'compatible_partner'
from public.z_knowledge_base
where (
  category = 'palace'
  and target_subject ilike '%부처궁%'
)
or (
  category = 'formation'
  and target_subject ilike '%부처궁%'
)
on conflict do nothing;

insert into public.z_love_tag_mapping (knowledge_base_id, tag)
select id, 'conflict_pattern'
from public.z_knowledge_base
where (
  category = 'star'
  and target_subject in (
    '거문성(巨門星)',
    '파군성 (破軍星)',
    '염정성 (명궁)',
    '염정성(廉貞星) 명궁 및 염정청백격(廉貞淸白格)',
    '염정성 - 형수협인격(刑囚夾印格)',
    '경양성 명궁 (경양 좌명)',
    '경양성 명궁 (擎羊星 命宮)',
    '영성 (鈴星)',
    '영성(鈴星)',
    '칠살성(七殺星)'
  )
)
or (
  category = 'formation'
  and (
    target_subject ilike '%부처궁%'
    and target_subject ilike '%화기%'
  )
)
on conflict do nothing;

insert into public.z_love_tag_mapping (knowledge_base_id, tag)
select id, 'solo_blocker'
from public.z_knowledge_base
where (
  category = 'star'
  and target_subject in (
    '거문성(巨門星)',
    '파군성 (破軍星)',
    '염정성 (명궁)',
    '염정성(廉貞星) 명궁 및 염정청백격(廉貞淸白格)',
    '염정성 - 형수협인격(刑囚夾印格)',
    '경양성 명궁 (경양 좌명)',
    '경양성 명궁 (擎羊星 命宮)',
    '영성 (鈴星)',
    '영성(鈴星)',
    '칠살성(七殺星)'
  )
)
or (
  category = 'formation'
  and (
    target_subject ilike '%신궁%'
    or target_subject ilike '%명궁%'
    or target_subject ilike '%화기%'
    or target_subject ilike '%살성%'
  )
)
on conflict do nothing;

insert into public.z_love_tag_mapping (knowledge_base_id, tag)
select id, 'charm_asset'
from public.z_knowledge_base
where (
  category = 'star'
  and target_subject in (
    '자미성(紫微星)',
    '천동성(天同星)',
    '천상성 (天相星)',
    '천부성(天府星)',
    '자미두수 도화성 (桃花星)',
    '자미두수 도화성(桃花星) 총론'
  )
)
or (
  category = 'formation'
  and (
    target_subject ilike '%자녀궁%'
    or target_subject ilike '%도화%'
    or target_subject ilike '%홍란%'
    or target_subject ilike '%천희%'
    or target_subject ilike '%천동%'
    or target_subject ilike '%천상%'
  )
)
on conflict do nothing;

insert into public.z_love_tag_mapping (knowledge_base_id, tag)
select id, 'encounter_path'
from public.z_knowledge_base
where (
  category = 'palace'
  and target_subject ilike '%천이궁%'
)
or (
  category = 'formation'
  and target_subject ilike '%천이궁%'
)
on conflict do nothing;

insert into public.z_love_tag_mapping (knowledge_base_id, tag)
select id, 'timing_signal'
from public.z_knowledge_base
where (
  category = 'formation'
  and (
    target_subject ilike '%2026년%'
    or target_subject ilike '%유년%'
    or target_subject ilike '%사화%'
    or target_subject ilike '%운세%'
    or target_subject ilike '%시기%'
  )
)
on conflict do nothing;

insert into public.z_love_tag_mapping (knowledge_base_id, tag)
select id, 'action_guide'
from public.z_knowledge_base
where (
  category = 'formation'
  and (
    target_subject ilike '%명궁%'
    or target_subject ilike '%신궁%'
    or target_subject ilike '%조언%'
    or target_subject ilike '%기본%'
  )
)
or (
  category = 'palace'
  and target_subject in (
    '명궁 (Life Palace)',
    '부처궁 (Spouse Palace)',
    '자녀궁 (Children Palace)'
  )
)
on conflict do nothing;

commit;

select tag, count(*)::int as cnt
from public.z_love_tag_mapping
group by tag
order by tag;
