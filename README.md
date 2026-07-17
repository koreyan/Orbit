# Orbit

자미두수 기반 자기이해 리포트 웹 MVP입니다. 로컬 작업 디렉터리명은 `Obit`이지만 사용자-facing 브랜드와 패키지명은 `Orbit`으로 통일합니다.

## 문서 우선순위

작업 전 아래 문서를 순서대로 확인합니다.

1. `AGENTS.md`
2. `PRD.md`
3. `.agents/rules/code-style-guide.md`
4. `.hermes.md`

## 개발 시작

```bash
npm install
npm run dev
```

기본 개발 서버:
- `http://localhost:3000`

## 주요 스크립트

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
npm run verify
```

의미:
- `lint`: ESLint 검사
- `typecheck`: TypeScript 타입 검사
- `test:unit`: Vitest 단위 테스트
- `build`: Next.js 프로덕션 빌드 검사
- `verify`: lint + typecheck + unit test + build 일괄 실행

E2E는 테스트 Supabase 프로젝트에서만 실행합니다. `.env.test.local`에 `E2E_SUPABASE_PROJECT_REF`를 지정하지 않으면 DB 쓰기 가능 E2E는 중단됩니다.

## 작업 원칙

- 제품 요구사항은 `PRD.md`를 우선합니다.
- 스타일 규칙 원본은 `.agents/rules/code-style-guide.md`입니다.
- 공통 에이전트 규칙은 `AGENTS.md`를 기준으로 유지합니다.
- Hermes 전용 세션 운영 규칙은 `.hermes.md`를 따릅니다.
- `any` 타입은 사용하지 않습니다.
- `use client`는 꼭 필요한 곳에만 사용합니다.
- 파일/폴더명은 `kebab-case`를 사용합니다.

## Hermes 작업 흐름

1. 현재 브랜치 확인
2. 작업트리 상태 확인
3. 관련 문서와 구현 파일 확인
4. 작은 단위로 수정
5. `npm run verify` 실행
6. 변경 파일과 검증 결과를 함께 보고

## 환경변수

- 예시 파일: `.env.example`
- 로컬 실행 값: `.env.local`에 직접 설정하며 Git에 커밋하지 않습니다.
- Vercel Preview/Production 변수는 Vercel 프로젝트 환경변수에서 관리합니다.
- 운영 리포트 생성 AI 공급자는 OpenAI입니다.
- Gemini 관련 스크립트는 `scripts/legacy/gemini/`에 보존되어 있으며 운영 리포트 경로에서 사용하지 않습니다.

## 레거시 보존 스크립트

- `scripts/legacy/debug/`: 과거 디버깅/scratch 스크립트 보존 위치입니다.
- `scripts/legacy/gemini/`: 과거 Gemini 실험/데이터 도구 보존 위치입니다.
- 두 디렉터리의 파일은 운영 런타임 코드가 아니며, 용도는 각 README에 기록되어 있습니다.

예시:

```bash
git branch --show-current
git status --short
npm run verify
```

## 참고

- 기존 Antigravity 기반 스타일/운영 규칙은 현재 저장소 문서로 옮겨 유지합니다.
- 작업 계획 문서는 `.hermes/plans/` 아래에 저장합니다.
