CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. z_knowledge_base 테이블 생성
CREATE TABLE z_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL, -- 'star', 'palace', 'formation'
    target_subject VARCHAR(255) NOT NULL, -- e.g. "자미두수 거문성 명궁 및 격국"
    teaser_quote VARCHAR(255), -- [결제 전 후킹용] 명반 페이지에서 보여줄 미끼 문구
    core_trait TEXT,
    career_insight TEXT,
    love_insight TEXT,
    wellness_insight TEXT,
    periodic_insight TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 검색 최적화를 위한 B-Tree 인덱스
-- 명반 매칭 시 target_subject 에 대해 ILIKE 검색 등을 수행하므로 인덱스가 유용합니다.
CREATE INDEX idx_z_knowledge_base_subject ON z_knowledge_base (target_subject);
