# Obit Codex/Hermes 마이그레이션 전략

> 계획 문서입니다. 마이그레이션 가드레일과 MCP 범위가 승인되기 전에는 애플리케이션 코드나 Hermes 설정을 수정하지 않습니다.

## 요약

Obit은 우선 코드 수정 없이도 Antigravity 중심 작업 방식에서 Codex + Hermes 방식으로 이전 검토가 가능합니다.

권장 순서는 아래와 같습니다.
1. 저장소 규칙을 중앙화한다.
2. 검증 명령을 표준화한다.
3. 꼭 필요한 MCP만 먼저 옮긴다.
4. 작은 파일럿으로 실제 작업성을 검증한다.

이번 조사에서 중요한 점은 두 가지입니다.
- 프로젝트 규칙이 이미 여러 곳에 흩어져 있다.
- Antigravity에 등록된 MCP 서버 정의를 Hermes 쪽으로 옮길 수 있다.

현재 규칙의 핵심 소스는 아래 3축입니다.
- `PRD.md`
- `.agents/rules/code-style-guide.md`
- `AGENTS.md` / `CLAUDE.md`

그리고 Antigravity의 MCP 설정은 저장소 밖 파일에 있으며, Hermes용 설정으로 번역 가능합니다.

---

## 확인된 사실

### 1) 저장소 쪽 사실

`/Users/white/Desktop/Obit` 기준 확인 결과:
- `AGENTS.md`는 존재하지만 현재 내용이 매우 얇습니다.
- `CLAUDE.md`는 현재 `@AGENTS.md`를 가리킵니다.
- `.agents/rules/code-style-guide.md`가 존재하며, 항상 적용되는 스타일 규칙이 들어 있습니다.
- `PRD.md`가 존재하며 제품 기준 문서 역할을 합니다.
- `README.md`는 아직 기본 온보딩 문서 수준입니다.
- `package.json`에는 `dev`, `build`, `start`, `lint`는 있지만 `typecheck`, `verify`는 없습니다.
- Playwright E2E 테스트가 이미 존재합니다.
- Supabase 관련 코드와 마이그레이션 파일이 존재합니다.
- 조사 시점에 워킹트리는 깨끗하지 않았습니다. (`PRD.md` 수정 상태 존재)

### 2) 규칙 소스

현재 규칙 소스는 아래처럼 나누어 보는 것이 맞습니다.
- `PRD.md` = 제품 의도와 요구사항
- `.agents/rules/code-style-guide.md` = 현재 Antigravity 계열 코딩 규칙
- `AGENTS.md` = 앞으로 키워야 할 공통 에이전트 규칙 파일
- `CLAUDE.md` = 호환용 포인터
- `.hermes.md` = 아직 없지만, 도입 시 Hermes 전용 규칙 위치로 적합

### 3) MCP 쪽 사실

이 머신에서 확인한 결과:
- 현재 Hermes에는 MCP 서버가 하나도 등록되어 있지 않습니다.
  - `hermes mcp list` 결과: `No MCP servers configured.`
- Antigravity/Gemini 쪽 MCP 설정 파일은 아래에 존재합니다.
  - `/Users/white/.gemini/config/mcp_config.json`
- 백업/복사본도 있습니다.
  - `/Users/white/.gemini/antigravity-backup/mcp_config.json`
  - `/Users/white/.gemini/antigravity-ide/mcp_config.json`

위 설정 파일에서 확인된 MCP 서버 목록:
- `context7`
- `github-mcp-server`
- `playwright`
- `sequential-thinking`
- `shadcn`
- `supabase`
- `tosspayments-integration-guide`
- `vercel`

---

## 반드시 보존해야 할 기존 규칙

`.agents/rules/code-style-guide.md`에서 확인된 핵심 규칙:
- `trigger: always_on`
- `PRD.md`를 최우선 기준으로 사용
- Next.js App Router 사용
- TypeScript 엄격 적용
- `any` 금지
- Tailwind 사용
- Shadcn/UI 스타일 지향
- 서버 로직은 Server Actions 중심
- 컴포넌트는 `const` + 화살표 함수
- 파일명은 `kebab-case`
- 대화와 주석은 한국어
- `use client` 최소화
- 메모리 누수/보안 취약점 자체 점검

의미:
- 마이그레이션은 새 스타일 체계를 만드는 작업이 아닙니다.
- 이미 존재하는 규칙을 Codex와 Hermes가 공통으로 읽게 만드는 작업에 가깝습니다.

---

## 마이그레이션 목표

1. Codex와 Hermes가 같은 저장소 규칙을 따르게 한다.
2. 숨겨진 규칙이나 분산된 규칙을 저장소 파일로 끌어올린다.
3. Antigravity에서 쓰던 핵심 MCP를 Hermes에서도 쓸 수 있게 만든다.
4. “완료” 기준을 채팅이 아니라 실행 가능한 명령으로 통일한다.
5. 워크플로우 계약이 승인되기 전에는 앱 코드를 건드리지 않는다.

## 1단계에서 하지 않을 것

- 앱 로직 대규모 수정
- OpenAI/리포트 생성 로직 교체
- 폴더 구조 개편
- Supabase 스키마 변경
- 모든 MCP를 무작정 일괄 이관

---

## 권장 규칙 구조

### 역할 분담

- `PRD.md`
  - 제품 의도
- `.agents/rules/code-style-guide.md`
  - 현재 레거시/Antigravity 규칙
- `AGENTS.md`
  - Codex/Hermes 공통 운영 규칙
- `CLAUDE.md`
  - `AGENTS.md`로 연결하는 호환 포인터
- `.hermes.md`
  - Hermes 전용 작업 방식
- `README.md`
  - 사람용 온보딩과 실행 명령 안내

### 실무 권장안

초기에는 `.agents/rules/code-style-guide.md`를 지우지 않는 것이 좋습니다.
대신 아래 순서가 적절합니다.
1. 기존 `.agents` 규칙은 유지한다.
2. 중요한 규칙을 `AGENTS.md`로 승격한다.
3. `AGENTS.md`를 공통 진입점으로 만든다.
4. Hermes 전용 규칙만 `.hermes.md`에 둔다.

이렇게 하면 Codex/Hermes가 서로 다른 방향으로 드리프트하는 것을 막을 수 있습니다.

---

## MCP 마이그레이션 판단

## 결론

Antigravity MCP 설정은 Hermes로 가져올 수 있습니다.
다만 “그대로 복붙”보다 “선별 이관”이 안전합니다.

이유:
- Hermes도 stdio 기반 MCP 서버를 지원합니다.
- Hermes는 `hermes mcp add <name> --command ... --args ...` 또는 `config.yaml`의 `mcp_servers`로 등록 가능합니다.
- Antigravity 설정 파일에는 서버 이름, 명령, 인자, 환경변수, 일부 비활성화 도구 정보가 들어 있습니다.
- 일부 항목은 토큰/권한/비활성화 정책을 검토한 뒤 가져와야 합니다.

---

## Antigravity MCP 목록과 우선순위

### 1차 이관 권장

Obit 실사용 평가와 직접 관련 있는 항목입니다.

1. `github-mcp-server`
- 용도:
  - 저장소, PR, 이슈 등 GitHub 워크플로우 평가
- 적합도:
  - 높음
- 메모:
  - 토큰 처리 재검토 필요
  - Antigravity에서 비활성화해 둔 도구가 있어, Hermes에서도 비슷한 안전장치가 필요한지 확인 필요

2. `supabase`
- 용도:
  - Obit은 Supabase 의존도가 높음
- 적합도:
  - 높음
- 메모:
  - 현재 Antigravity 설정에는 migration/branch류 고위험 도구 비활성화가 들어 있음
  - 이 보수적 정책을 가능하면 유지하는 것이 좋음
  - 토큰 권한 검토 필요

3. `sequential-thinking`
- 용도:
  - 구조적 사고/계획 보조
- 적합도:
  - 높음
- 메모:
  - 인프라형 MCP보다 위험도가 낮음

4. `tosspayments-integration-guide`
- 용도:
  - Obit이 Toss Payments를 사용함
- 적합도:
  - 높음
- 메모:
  - 주로 통합 가이드 성격이지만, 이 프로젝트 맥락에서는 유효함

### 2차 이관 후보

5. `playwright`
- 용도:
  - 브라우저/테스트 보조
- 적합도:
  - 중상
- 메모:
  - 이미 Playwright 테스트가 있으므로 유용할 수 있음

6. `vercel`
- 용도:
  - 배포/호스팅 워크플로우
- 적합도:
  - 중간
- 메모:
  - Hermes가 배포 관련 작업까지 맡길지에 따라 필요성이 갈림
  - 토큰 검토 필요

7. `context7`
- 용도:
  - 외부 프레임워크/패키지 문서 조회
- 적합도:
  - 중간
- 메모:
  - 있으면 좋지만 초기 평가의 핵심은 아님

8. `shadcn`
- 용도:
  - UI 컴포넌트 관련 작업
- 적합도:
  - 중하
- 메모:
  - UI 작업에는 도움되지만, 초기 마이그레이션 필수 요소는 아님

---

## MCP 번역 방식

원본 파일:
- `/Users/white/.gemini/config/mcp_config.json`

Hermes 쪽 대상 위치:
- 지속 설정 기준: `~/.hermes/profiles/sophie/config.yaml` 안의 `mcp_servers`
- 또는 CLI로 `hermes mcp add` 사용

### 변환 패턴

Antigravity 쪽 형태:
```json
{
  "name": {
    "command": "npx",
    "args": ["-y", "package-name"],
    "env": {"KEY": "value"}
  }
}
```

Hermes 쪽 형태:
```yaml
mcp_servers:
  name:
    command: "npx"
    args: ["-y", "package-name"]
    env:
      KEY: "value"
```

### 서버별 번역 가능성

1. GitHub
- 원본 이름: `github-mcp-server`
- 명령: `npx`
- 인자: `-y @modelcontextprotocol/server-github`
- Hermes 적합성: 높음
- 상태: 이관 가능
- 추가 작업:
  - 토큰 안전 재입력
  - 비활성화 도구 정책 재확인

2. Supabase
- 원본 이름: `supabase`
- 명령: `npx`
- 인자: `-y @supabase/mcp-server-supabase@latest`
- Hermes 적합성: 높음
- 상태: 이관 가능
- 추가 작업:
  - 토큰 안전 재입력
  - 고위험 도구 비활성화 정책 유지 검토

3. Sequential Thinking
- 원본 이름: `sequential-thinking`
- 명령: `npx`
- 인자: `-y @modelcontextprotocol/server-sequential-thinking`
- 상태: 매우 쉽게 이관 가능

4. TossPayments Integration Guide
- 원본 이름: `tosspayments-integration-guide`
- 명령: `npx`
- 인자: `-y @tosspayments/integration-guide-mcp@latest`
- 상태: 매우 쉽게 이관 가능

5. Playwright
- 원본 이름: `playwright`
- 명령: `npx`
- 인자: `@playwright/mcp@latest`
- 상태: 이관 가능

6. Vercel
- 원본 이름: `vercel`
- 명령: `npx`
- 인자: `-y vercel`
- 상태: 가능성 높음, 다만 실제 Hermes에서 테스트 필요
- 추가 작업:
  - 토큰 검토
  - `hermes mcp test`로 실제 동작 확인

7. Context7
- 원본 이름: `context7`
- 명령: `npx`
- 인자: `-y @upstash/context7-mcp@latest`
- 상태: 이관 가능

8. Shadcn
- 원본 이름: `shadcn`
- 명령: `npx`
- 인자: `-y shadcn@latest mcp`
- 상태: 이관 가능성이 높지만 실제 테스트 필요

---

## MCP 이관 리스크

### 리스크 1 — 원본 설정 파일에 자격증명이 들어 있음

Antigravity/Gemini 설정에서 아래 성격의 값이 확인됩니다.
- GitHub 토큰
- Supabase 액세스 토큰
- Vercel 토큰
- Context7 API 키

권장:
- 원본 JSON을 공유용 파일로 취급하지 않습니다.
- Hermes에는 자격증명을 의도적으로 재입력하는 방식이 안전합니다.
- 저장소 파일에는 비밀값을 두지 않습니다.

### 리스크 2 — 비활성화 도구 정책이 1:1로 안 옮겨질 수 있음

Antigravity 설정에는 특히 GitHub, Supabase에 `disabledTools`가 들어 있습니다.

권장:
- 서버 등록 후 Hermes가 어떤 도구를 실제로 노출하는지 확인합니다.
- 가능하면 비슷한 제한을 다시 적용합니다.
- 완전한 동일성이 어렵다면 1차 이관 범위를 더 줄이는 것이 낫습니다.

### 리스크 3 — 모든 MCP가 지금 필요한 것은 아님

권장:
- 1차는 GitHub / Supabase / Sequential Thinking / TossPayments만
- 나머지는 실제 필요가 생길 때 추가

### 리스크 4 — 프로필 충돌

사용자 선호상, 여러 Hermes 프로필 동시 운용 시 토큰/플랫폼 충돌 방지가 중요합니다.

권장:
- Obit 평가를 계속할 경우, `sophie`에 다 몰아넣기보다 Obit 전용 Hermes 프로필을 분리하는 편이 안전합니다.
- 이렇게 하면 평가 환경을 되돌리기도 쉽습니다.

---

## 권장 마이그레이션 단계

## Phase 0 — 지금 단계: 읽기/판단만

상태:
- 현재 단계

작업:
- 저장소 규칙 조사
- Antigravity MCP 조사
- 계획 문서 작성

산출물:
- 이 계획 문서
- 대상 파일 목록
- MCP 인벤토리와 우선순위

주의:
- 앱 코드 수정 없음
- Hermes 설정 수정 없음

## Phase 1 — 규칙 중앙화

나중에 승인되면 손댈 파일:
- `/Users/white/Desktop/Obit/AGENTS.md`
- `/Users/white/Desktop/Obit/.hermes.md`
- `/Users/white/Desktop/Obit/README.md`
- 필요시 `/Users/white/Desktop/Obit/CLAUDE.md`

작업:
1. `.agents/rules/code-style-guide.md`의 핵심 규칙을 `AGENTS.md`로 승격
2. `CLAUDE.md`는 포인터 유지
3. Hermes 전용 규칙만 `.hermes.md`에 추가
4. `AGENTS.md`에 읽는 순서 명시
   - `AGENTS.md`
   - `PRD.md`
   - `.agents/rules/code-style-guide.md`
   - 관련 구현 파일/테스트

## Phase 2 — 검증 표준화

나중에 승인되면 손댈 파일:
- `/Users/white/Desktop/Obit/package.json`
- 선택: `/Users/white/Desktop/Obit/.editorconfig`
- 선택: `/Users/white/Desktop/Obit/.github/workflows/ci.yml`

작업:
- `typecheck` 추가
- `test:e2e` 추가
- `verify` 추가
- CI도 같은 `verify`를 실행하게 통일

목표:
- 사람, Codex, Hermes, CI가 같은 완료 기준을 쓰게 함

## Phase 3 — 최소 MCP 이관

권장 1차 이관 세트:
- GitHub
- Supabase
- Sequential Thinking
- TossPayments Integration Guide

지속 설정 기준 대상 위치:
- `/Users/white/.hermes/profiles/sophie/config.yaml`

더 안전한 대안:
- Obit 전용 Hermes 프로필을 먼저 만들고, 그 프로필의 `config.yaml`에만 MCP를 넣기

작업:
1. 대상 프로필 결정 또는 생성
2. 1차 MCP 서버 등록
3. 가능하면 `hermes mcp test <name>`로 서버별 점검
4. 노출 도구와 권한 범위 확인
5. 이후 2차 MCP 판단

## Phase 4 — 파일럿

낮은 위험 작업부터 검증:
1. 문서만 수정하는 작업
2. 코드 읽기/분석 중심 작업
3. 작은 비핵심 수정
4. 이후에만 결제/리포트 인접 작업

성공 기준:
- 규칙을 반복 지시 없이 따름
- 검증 명령이 일관됨
- MCP가 필요한 범위에서 정상 동작
- 원치 않는 프로필/토큰 충돌이 없음

---

## 1차 MCP 권장 세트

Hermes가 Obit에 실질적으로 쓸 만한지 평가하려면, 우선 아래 4개만 붙이는 것이 좋습니다.

1. `github-mcp-server`
- 저장소/PR 워크플로우 평가에 필요

2. `supabase`
- Obit 운영 맥락상 중요

3. `sequential-thinking`
- 평가 단계에서 계획/추론 품질 확인에 유용

4. `tosspayments-integration-guide`
- Obit의 결제 맥락과 직접 연결

이 세트가 좋은 이유:
- 프로젝트 관련성이 높음
- 실제 사용성 판단에 충분함
- 초기 결정 단계에서 불필요한 MCP 남용을 막음

---

## 알아둘 파일 위치

### 저장소 파일
- `/Users/white/Desktop/Obit/AGENTS.md`
- `/Users/white/Desktop/Obit/CLAUDE.md`
- `/Users/white/Desktop/Obit/PRD.md`
- `/Users/white/Desktop/Obit/.agents/rules/code-style-guide.md`
- `/Users/white/Desktop/Obit/README.md`
- `/Users/white/Desktop/Obit/package.json`
- `/Users/white/Desktop/Obit/playwright.config.ts`
- `/Users/white/Desktop/Obit/tests/e2e/`
- `/Users/white/Desktop/Obit/supabase/migrations/`

### 이번 마이그레이션 계획서
- `/Users/white/Desktop/Obit/.hermes/plans/2026-06-23_162458-codex-hermes-migration-strategy.md`

### Antigravity/Gemini MCP 원본
- `/Users/white/.gemini/config/mcp_config.json`
- `/Users/white/.gemini/antigravity-backup/mcp_config.json`
- `/Users/white/.gemini/antigravity-ide/mcp_config.json`

### Hermes 설정 위치
- 공용 기본 설정: `/Users/white/.hermes/config.yaml`
- 현재 프로필 설정: `/Users/white/.hermes/profiles/sophie/config.yaml`

만약 Obit 전용 프로필을 따로 만들면 대상 위치는 아래처럼 바뀝니다.
- `/Users/white/.hermes/profiles/<새-프로필>/config.yaml`

---

## 권장 결론

지금 당장은 전부 적용하지 않는 것이 맞습니다.

추천 다음 단계:
1. 앱 코드는 그대로 둔다.
2. 현재 Hermes MCP도 그대로 둔다.
3. `sophie` 프로필에 붙일지, Obit 전용 새 프로필에 붙일지 먼저 결정한다.
4. 진행한다면 1차 MCP만 먼저 가져온다.
5. 그 다음 `AGENTS.md`, `.hermes.md` 초안을 만든다.

이 경로가 가장 되돌리기 쉽고, 위험이 낮고, Hermes 도입 판단에 필요한 신호를 충분히 줍니다.

---

## 실제 적용 전에 남은 질문

1. MCP 평가는 `sophie` 안에서 할지, Obit 전용 새 프로필에서 할지?
2. GitHub/Supabase는 비활성화 도구 정책까지 최대한 맞출지, 일단 연결만 볼지?
3. Vercel은 이번 평가 범위에 넣을지, 일단 제외할지?
4. `.agents/rules/code-style-guide.md`는 장기적으로 유지할지, 개념적으로 `AGENTS.md`에 흡수할지?
5. 첫 성공 기준을 “Hermes가 같은 MCP를 쓸 수 있다”로 볼지, “Hermes가 더 적은 MCP로도 안전하게 일할 수 있다”로 볼지?