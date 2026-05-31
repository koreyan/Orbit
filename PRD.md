# Product Requirement Document
(PRD)

## 1. 프로젝트 개요 (Project Overview)

- **프로젝트 명**: Orbit (자미두수로 자신을 이해하다)
- **목표**: 자미두수 명리학 기반의 초개인화 AI 분석을 통해, 유저의 고유한 성향과 매력, 장단점을 진단하고 시기별 맞춤형 라이프스타일 가이드라인을 제시.
- **핵심 가치 1 (차별화된 경험 및 분석)**: 몽환적이고 직관적인 UI/UX와 고도화된 AI 알고리즘을 결합하여, 높은 정확도의 인사이트와 몰입감 있는 서비스 경험 제공.
- **핵심 가치 2 (개인화된 커리어 방향성 제시)**: 유저의 잠재력과 강점을 극대화할 수 있는 최적의 진로 및 직업 추천.
- **핵심 가치 3 (매력 자산 기반 관계 가이드)**: 개인의 고유한 매력 요소를 분석하고 이를 활용한 맞춤형 연애 및 대인관계 조언 제공.
- **핵심 가치 4 (맞춤형 여가 및 웰니스 제안)**: 유저의 성향을 바탕으로 심리적 만족도와 행복감을 높일 수 있는 취미 활동 추천.
- **핵심 가치 5 (시기별 전략적 라이프 플래닝)**: 운세 흐름에 맞춰 특정 시기에 대비하고 실행해야 할 핵심 액션 플랜 제공.

## 2. 타겟 유저(Target Audience)

- **Core Target (핵심 타겟)**: 운세 및 사주 등 명리학 기반의 자기 탐구와 자아실현에 관심도가 높은 2030 MZ세대.
- **Behavioral Target (행동적 타겟)**: 모바일 환경에 친숙하며, 복잡한 텍스트 위주의 해설보다는 직관적인 UI/UX와 시각화된 데이터를 통해 초개인화된 분석 결과를 소비하고자 하는 사용자.

## 3. 기술 스택(Tech Stack)

- **Web Framework**: Next.js 16.2.6(App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend & DB**: Next.js API Routes, Supabase
- **Payments**: Toss Payments
- **AI**: Gemini with gemini sdk

## 4. 디자인 가이드(Design Guide)

- **컨셉**: "Cosmic Constellation" (칠흑 우주와 빛나는 별자리)
- **배경**: Deep Space Black (#050510)과 Nebula Orange/Indigo 그라데이션
- **요소**: 우주 유리판(Glassmorphism), 반짝이는 별 배경 애니메이션, 유성 효과
- **포인트 컬러**: Cosmic Orange (#FF6B35), Warm Amber (#FFAB40), Gold Glow (#FFD700)
- **폰트**: 가독성 좋은 Sans-serif 계열 (Pretendard) + 서비스명 포인트 폰트

## 5. 프로젝트 환경 (Project Environment)

- **GitHub Repository**: [https://github.com/koreyan/Orbit](https://github.com/koreyan/Orbit)
- **Vercel Production URL**: [https://orbit-six-gamma.vercel.app](https://orbit-six-gamma.vercel.app)

## 6. 유저 플로우 (User flow)

1. **랜딩 페이지 (Landing Page)**
   - 서비스 소개 및 핵심 가치 전달 (우주/별자리 컨셉의 인터랙티브 UI)
   - '내 별자리 분석하기' (Call to Action) 버튼 배치

2. **온보딩 및 정보 입력 (Onboarding & Input)**
   - 이름, 생년월일, 태어난 시간, 성별 등 명리학(자미두수) 분석에 필요한 기본 정보 입력
   - 직관적이고 부드러운 스텝바이스텝(Step-by-step) UI 제공

3. **분석 중 (Loading & Analysis)**
   - Gemini AI 및 자미두수 알고리즘을 활용한 데이터 분석 진행
   - 우주적 컨셉을 살린 로딩 애니메이션으로 유저 이탈 방지

4. **메인 대시보드 (Main Dashboard / Report)**
   - 유저의 고유한 성향과 운세 흐름을 시각화된 차트/그래프로 요약 제공
   - **주요 카테고리 메뉴**:
     - 🌟 **Core Identity**: 기본 성향, 매력, 장단점 분석
     - 💼 **Career & Potential**: 잠재력 기반 진로 및 직업 추천
     - ❤️ **Relationship**: 매력 자산 기반 연애/대인관계 가이드
     - 🧘 **Wellness**: 성향 맞춤형 취미 및 여가 제안
     - 📅 **Life Planning**: 시기별(월/년) 운세 흐름 및 액션 플랜

5. **상세 분석 및 프리미엄 리포트 (Detail & Premium)**
   - 각 카테고리별 심층 분석 리포트 제공
   - 특정 심층 리포트 열람 시 결제 유도 (Toss Payments 연동)

6. **마이페이지 (My Page)**
   - 지난 분석 결과 다시보기 (저장된 리포트)
   - 결제 내역 및 구독 관리
   - 개인정보(생년월일 등) 수정
