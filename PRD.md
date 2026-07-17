# Orbit PRD

> 현재 제품 계약 기준 문서입니다. 과거 구현 로그는 `docs/implementation-history.md`에 보존합니다.

## 1. 제품 개요와 핵심 사용자

- **제품명:** Orbit
- **목표:** 자미두수 명반과 AI 리포트를 통해 사용자가 자신의 성향, 관계 매력, 커리어/라이프 방향을 이해하도록 돕는 웹 MVP.
- **핵심 사용자:** 운세·사주·자기이해 콘텐츠에 관심 있는 2030 입문자와 모바일 중심 사용자.
- **현재 운영 단계:** 피드백 수집용 데모 단계.

## 2. 현재 제공 기능과 미완료 기능 구분

| 구분 | 상태 | 기준 |
|---|---|---|
| 랜딩 입력 → 명반 생성 | 유지 | 생년월일시, 성별, 지역 입력 후 `/result` 이동 |
| 명반 표시 | 유지 | 전체 명반, 대한/유년 하이라이트, 운세 보는 법 모달 |
| 테마 선택 | 유지 | `career`, `love`, `hobby` 키 유지 |
| 연애 테마 0원 데모 | 유지 | 현재 활성 상품은 `love` 0원, Toss 위젯 스킵 |
| 커리어/여가 상품 | 준비중 | 가격 표기는 유지하되 주문 생성은 서버 상품표에서 비활성 처리 |
| 익명 주문/결제/계정 연동 | 유지+보안 강화 진행 | 주문은 서버 상품표 금액으로 생성, 0원 스킵은 `love` 0원 데모만 허용 |
| 리포트 보관함/상세/공유 | 유지 | `/reports`, `/reports/[report-id]`, 공유 Route Handler |
| 관리자 로그인/대시보드/주문/유저 | 유지 | 실제 Supabase 조회 기반 |
| 환불 기능 | 미구현 | 관리자 상세의 환불 관련 UI는 안내/미구현 상태 |
| GA4 | 미구현 | 현재 코드에 구현 없음 |
| 약관/개인정보/문의/사업자 정보 | 미완성 | placeholder/TODO 성격 문구 포함 가능 |

## 3. 사용자 여정 및 URL별 수용 기준

| URL | 역할 | 수용 기준 |
|---|---|---|
| `/` | 랜딩/명반 입력 | 유효 입력 시 명반 데이터 생성, 누락/무효 입력 차단 |
| `/result` | 명반 및 테마 선택 | 새로고침 가능한 쿼리 기반 명반 표시, 테마 미선택 주문 차단 |
| `/checkout` | 주문 확인/결제 | `orderId`로 최소 주문 필드 조회, 0원 주문은 Toss 위젯 미노출 |
| `/checkout/success` | 결제 승인/계정 연동 | DB 주문 금액과 요청 금액 대조, 결제 완료 후 계정 연동 폼 노출 |
| `/checkout/fail` | 결제 실패 | 실패 코드/메시지 안내 및 재시작 경로 제공 |
| `/login` | 비회원 로그인 | 전화번호 기반 로그인, 실패 잠금 안내 |
| `/reports` | 보관함 | 로그인 사용자 본인 리포트 목록 조회 |
| `/reports/[report-id]` | 리포트 상세 | 본인 또는 공개 공유 리포트만 조회 |
| `/reports/forbidden` | 권한 실패 | 타인 비공개 리포트 접근 차단 안내 |
| `/terms`, `/privacy`, `/contact` | 정책/문의 | 현재 문구는 최종 법무/사업자 정보 확정 전 상태 |

## 4. 관리자 여정 및 권한 기준

| URL | 역할 | 권한 기준 |
|---|---|---|
| `/admin-login` | 관리자 로그인 | 관리자 계정 인증 후 `/admin` 접근 |
| `/admin` | 대시보드 | 관리자 권한 검증 후 요약 데이터 조회 |
| `/admin/order-list` | 주문 목록 | 전체 주문 조회, 상태별 표시 |
| `/admin/order-list/[report-id]` | 주문/리포트 상세 | 관리자 권한 검증 후 리포트 재생성 가능 |
| `/admin/user-list` | 유저 목록 | 관리자 제외/마스킹 등 현재 구현 기준 유지 |

## 5. 현재 기술 스택과 런타임/배포 토폴로지

- **Framework:** Next.js 16.2.6 App Router
- **React:** 19.2.4
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS 4, Shadcn/Base UI 스타일 컴포넌트
- **Backend:** Server Actions 중심, 일부 Route Handler
- **DB/Auth:** Supabase Auth/PostgreSQL/RLS
- **Payments:** Toss Payments v2
- **AI:** 운영 리포트 생성 경로는 OpenAI `gpt-4o-mini`
- **Legacy AI tools:** Gemini 실험 도구는 `scripts/legacy/gemini/` 보존, 운영 리포트 경로에서 미사용
- **Repository:** `https://github.com/koreyan/Orbit.git`
- **현재 확인된 Vercel alias:** `https://orbit-sepia-alpha.vercel.app`
- **로컬 디렉터리:** `/Users/white/Desktop/Obit` — 디렉터리명은 이번 범위에서 변경하지 않음

## 6. 프론트엔드 상태·반응형·접근성 계약

- URL과 쿼리 기반 상태를 유지해 새로고침/뒤로가기 회귀를 막는다.
- `use client`는 상호작용이 필요한 컴포넌트에만 둔다.
- Orbit 직접 작성 컴포넌트는 kebab-case 파일명과 `const` + 화살표 함수 규칙을 따른다.
- `src/components/ui/`의 Shadcn/Base UI 기본 컴포넌트는 생성 원본 갱신 가능성을 위해 화살표 함수 강제 규칙에서 제외한다.
- 모바일 WebKit 자동 검증은 아직 정비 대상이다.

## 7. Server Action 및 Route Handler 계약

### Server Actions

| 파일 | 주요 액션 | 현재 계약 |
|---|---|---|
| `src/app/actions/auth.ts` | 로그인/로그아웃/관리자 로그인 | Supabase Auth 세션 발급, 관리자 role 검증 |
| `src/app/actions/myeongban.ts` | `getMyeongbanAction` | 입력 생년월일시로 명반 생성 및 기초 해석 조회 |
| `src/app/actions/order.ts` | `createAnonymousOrderAction`, `getOrderAction`, `linkUserToOrderAction` | 주문 생성은 서버 상품표 기준 금액 사용, 주문 조회는 결제 화면 최소 필드 반환 |
| `src/app/actions/payment.ts` | `confirmPaymentAction` | 무료 결제는 활성 `love` 0원 데모 주문만 허용, mock/E2E 결제키는 비운영에서만 허용 |
| `src/app/actions/report.ts` | `generateReportAction`, 공유 관련 액션 | 리포트 생성/상태 전이/OpenAI 호출/알림 오케스트레이션 |

### Route Handlers

| Method/Path | 역할 |
|---|---|
| `GET /api/reports/[id]` | 리포트 조회 |
| `GET /api/reports/shared/[id]` | 공개 공유 리포트 조회 |
| `POST /api/webhooks/toss` | Toss 비동기 웹훅 수신. 발신 진위 검증은 아직 운영 완료로 보지 않음 |

## 8. 인증·인가·결제·공유 보안 정책

- 클라이언트가 보낸 상품 금액은 신뢰하지 않고 `src/lib/products/catalog.ts` 서버 상품표를 기준으로 주문 금액을 확정한다.
- 현재 활성 무료 데모는 `love + enabled + amount 0 + freeDemo` 조합뿐이다.
- `free_*` 결제키는 서버 상품표상 무료 데모 주문일 때만 승인한다.
- `mock_*`, `E2E_TEST_MOCK_PAYMENT_KEY`는 `NODE_ENV=production`에서 거부한다.
- 결제 승인 시 주문 금액/요청 금액/Toss 승인 금액을 서버 상품표와 대조한다.
- 기존 전화번호 계정의 비밀번호를 새 입력값으로 덮어쓰는 UX는 데모 단계 임시 수용 위험이다. 정식 공개 또는 유료 상품 활성화 전 재검토한다.
- 로그인 rate limit은 현재 프로세스 메모리 기반이면 운영 보안 완료로 보지 않는다.
- 공유 리포트는 공개 설정된 경우에만 비로그인 접근을 허용한다.

## 9. DB 테이블·관계·상태 전이·RLS

| 테이블 | 용도 | 비고 |
|---|---|---|
| `users` | Supabase Auth 확장 사용자 | role/phone 관리 |
| `orders` | 익명/귀속 주문, 사주 데이터, 테마, 금액, 상태 | 결제 전 `pending`, 결제 후 `paid` |
| `payments` | 결제 트랜잭션 | 무료 결제도 0원 payment row 기록 |
| `reports` | AI 리포트 콘텐츠와 상태 | `pending/generating/completed/failed` |
| `z_knowledge_base` | 자미두수 지식베이스 | 저장소 migration의 `search_vector` 설명과 실제 스키마 차이 확인 필요 |
| `z_love_configs` | 연애 테마 정규화 설정 | 저장소 migration에 전체 생성 이력 공백 있음 |
| `z_love_tag_mapping` | 과거 연애 태그 매핑 | `supabase/migrations/0004_love_tag_mapping.sql`에는 생성 이력이 있으므로 “삭제 완료”로 단정하지 않음 |

DB 변경은 운영 데이터를 삭제하지 않고 forward-only migration으로만 수행한다.

## 10. 외부 서비스와 환경변수 소유권

| 변수 | 공개 범위 | 소유/용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | RLS 우회가 필요한 서버 액션/관리 작업 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | public | Toss 위젯 클라이언트 키 |
| `TOSS_SECRET_KEY` | server-only | Toss Confirm API |
| `OPENAI_API_KEY` | server-only | 운영 AI 리포트 생성 |
| `TELEGRAM_BOT_TOKEN` | server-only | 알림 발송 |
| `TELEGRAM_CHAT_ID` | server-only | 알림 대상 채팅 |
| `NEXT_PUBLIC_E2E_MOCK`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` | test-only | 자동 테스트 전용 |
| `GEMINI_API_KEY` | legacy-tool-only | `scripts/legacy/gemini/` 도구 전용 |

예시 파일은 `.env.example`을 기준으로 한다. 실제 값은 커밋하지 않는다.

## 11. 오류/재시도/알림 정책

- 결제 실패는 `/checkout/fail`로 코드와 메시지를 전달한다.
- Toss `ALREADY_PROCESSED_PAYMENT`는 중복 승인으로 간주해 DB 업데이트 흐름을 계속할 수 있다.
- 리포트 생성 실패는 실패 상태와 수동 재생성 UX를 사용한다.
- 결제/리포트 상태 알림은 Telegram으로 발송한다.
- Telegram 실패가 핵심 DB 상태 전이를 숨기면 안 된다.

## 12. 테스트 전략과 확인된 테스트 상태

| 명령 | 이번 기준선 결과 | 비고 |
|---|---|---|
| `npm run lint` | 실패 | 기존 `love-data-extractor.ts`의 `any` 6건, unused warning 7건 |
| `npm run typecheck` | 통과 | `tsc --noEmit` 통과 |
| `npm run test:unit` | 통과 | Vitest 2 files / 8 tests |
| `npm run build` | 통과 | Next build 통과, 단 `next.config.ts`가 타입 검증 스킵 중 |
| `npm run verify` | 현재 실패 예상 | lint baseline 실패 때문에 전체 verify는 아직 green 아님 |
| Playwright E2E | 미실행 | 테스트 Supabase 확인 전 DB 쓰기 E2E 금지 |

## 13. 알려진 제약 및 승인 대기 항목

- 테스트 전용 Supabase 프로젝트 실제 생성/키 설정은 별도 확인이 필요하다.
- 원격 Supabase schema/RLS/migration history 읽기 권한 확인이 필요하다.
- Toss 웹훅 진위 검증 방식은 공식 문서 확인 후 구현해야 한다.
- `typescript.ignoreBuildErrors: true` 제거는 lint/type debt 정리 후 수행한다.
- 대형 파일 분리는 characterization test 보강 후 단계적으로 진행한다.

## 14. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-07-17 | 현재 코드 기준으로 PRD를 제품 계약 중심 문서로 재구성하고 과거 구현 로그를 `docs/implementation-history.md`로 분리 |
| 2026-07-17 | 서버 상품표, 무료 데모 결제 정책, Vitest 단위 테스트 기준 추가 |
