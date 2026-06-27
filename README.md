# Obit

Obit 프로젝트 작업용 저장소입니다.

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
npm run test:e2e
npm run build
npm run verify
```

의미:
- `lint`: ESLint 검사
- `typecheck`: TypeScript 타입 검사
- `build`: Next.js 프로덕션 빌드 검사
- `verify`: lint + typecheck + build 일괄 실행

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

예시:

```bash
git branch --show-current
git status --short
npm run verify
```

## 참고

- 기존 Antigravity 기반 스타일/운영 규칙은 현재 저장소 문서로 옮겨 유지합니다.
- 작업 계획 문서는 `.hermes/plans/` 아래에 저장합니다.
