<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Obit Repository Rules

이 저장소에서 작업하는 모든 에이전트는 아래 순서로 문맥을 읽습니다.

1. `AGENTS.md`
2. `PRD.md`
3. `.agents/rules/code-style-guide.md`
4. 관련 구현 파일
5. 관련 테스트 파일

## Source of Truth

- 제품 요구사항 기준 문서: `PRD.md`
- 레거시 스타일 규칙 원본: `.agents/rules/code-style-guide.md`
- 공통 에이전트 작업 규칙 진입점: `AGENTS.md`
- Hermes 전용 운영 규칙: `.hermes.md`가 있으면 함께 따른다.

중요:
- `.agents/rules/code-style-guide.md`는 숨은 규칙 표면이다.
- 규칙 충돌 시 제품 요구사항은 `PRD.md`를 우선한다.
- 구현 전에 현재 파일과 테스트가 이미 보여주는 동작을 먼저 확인한다.

## Tech Stack Rules

- Framework: Next.js App Router 기준으로 작업한다.
- Language: TypeScript strict를 유지한다.
- `any` 타입은 사용하지 않는다.
- Styling: Tailwind CSS를 사용한다.
- UI: Shadcn 스타일과 재사용 가능한 컴포넌트 분리를 우선한다.
- Backend: 서버 로직은 Server Actions 중심으로 유지한다.

## Coding Conventions

- 모든 컴포넌트는 `const` + 화살표 함수로 작성한다.
- 파일명과 폴더명은 `kebab-case`를 사용한다.
- `use client`는 꼭 필요한 컴포넌트에만 선언한다.
- 주석과 사용자-facing 문구는 한국어를 기본으로 한다.
- 주석은 왜 필요한지 설명할 때만 최소한으로 쓴다.
- 비동기 로직은 실패 경로를 함께 고려한다.
- 메모리 누수, 보안 취약점, 과도한 클라이언트 상태 증가를 먼저 의심한다.

## Working Rules

- 작업 전 관련 파일을 먼저 읽고, 추측으로 구조를 만들지 않는다.
- 큰 작업은 먼저 계획을 세우고 시작한다.
- 코드 수정 후에는 검증 명령을 실제로 실행한다.
- 완료 보고에는 최소한 변경 파일과 검증 결과를 포함한다.
- 아직 없는 명령을 있다고 가정하지 않는다. 필요하면 먼저 스크립트를 추가한다.

## Validation

현재 기본 확인 명령:
- `npm run lint`
- `npm run build`

추가 표준화된 명령:
- `npm run typecheck`
- `npm run verify`
- 필요 시 `npm run test:e2e`

검증 명령이 변경되면 이 문서와 `README.md`를 함께 갱신한다.
