import { describe, expect, it } from "vitest";

import { cleanMarkdown, splitMarkdownSections } from "../../src/lib/reports/report-markdown";

describe("리포트 마크다운 정리", () => {
  it("마크다운 코드펜스를 제거한다", () => {
    expect(cleanMarkdown("```markdown\n# 제목\n본문\n```")).toBe("# 제목\n본문");
    expect(cleanMarkdown("```\n내용\n```")).toBe("내용");
  });

  it("번호 제목 기준으로 섹션을 나눈다", () => {
    expect(splitMarkdownSections("인트로\n\n1. 첫 번째\n본문1\n\n2. 두 번째\n본문2")).toEqual([
      { title: "요약", body: "인트로" },
      { title: "첫 번째", body: "본문1" },
      { title: "두 번째", body: "본문2" },
    ]);
  });

  it("제목이 없으면 기본 단일 섹션으로 반환한다", () => {
    expect(splitMarkdownSections("본문만 있음")).toEqual([
      { title: "나의 별빛 이야기", body: "본문만 있음" },
    ]);
  });
});
