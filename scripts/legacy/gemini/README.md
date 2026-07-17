# Gemini legacy scripts

운영 리포트 생성 경로는 OpenAI를 사용합니다. 이 디렉터리의 파일은 과거 Gemini 실험/데이터 정규화 도구를 삭제하지 않고 보존한 것입니다.

- `normalize-data.ts`: `GEMINI_API_KEY`를 사용해 원천 데이터를 정규화하던 실험 도구입니다.
- `test-gemini.js`: Gemini API 연결 확인용 스크립트입니다.
- `test-models.js`: Gemini 모델 호출 실험용 스크립트입니다.

필요 환경변수:

- `GEMINI_API_KEY`

주의:

- 이 파일들은 사용자 리포트 생성 런타임에서 호출하지 않습니다.
- 실행 전 대상 데이터와 환경변수를 별도로 확인합니다.
