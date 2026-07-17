# Debug legacy scripts

운영 코드가 아니라 과거 점검/디버깅을 위해 사용한 보존 스크립트입니다.

- `scratch-check-report.mjs`: `reports` 테이블 컬럼과 유년 데이터 형태를 빠르게 확인하던 스크립트입니다. `.env.local`은 프로젝트 루트 기준 상대 경로로 로드합니다.
- `scratch-liuyue.mjs`: `@orrery/core/ziwei` 경로의 유월 계산 출력 확인용 스크립트입니다.
- `scratch-liuyue.ts`: `@orrery/core` 경로의 유월 계산 출력 확인용 TypeScript 스크립트입니다.

자동 회귀 검증은 이 파일들이 아니라 승인된 Vitest/Playwright 테스트로 작성합니다.
