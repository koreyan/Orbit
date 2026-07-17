import { describe, expect, it } from "vitest";

import { cleanMarkdown, splitMarkdownSections, stripLoveTipSection } from "../../src/lib/reports/report-markdown";

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

  it("표준 5-2 연애 팁 섹션만 제거하고 5-1과 다음 섹션은 유지한다", () => {
    const markdown = [
      "### 5-1. 올해 연애운",
      "7월: 흐름",
      "",
      "### 5-2. 연애 팁 (개운 처방전)",
      "삭제될 팁",
      "",
      "## 6. 마무리",
      "유지될 내용",
    ].join("\n");

    expect(stripLoveTipSection(markdown)).toEqual({
      removed: true,
      markdown: "### 5-1. 올해 연애운\n7월: 흐름\n\n## 6. 마무리\n유지될 내용",
    });
  });

  it("연애 팁 heading 변형을 제거한다", () => {
    const variants = [
      "## 5-2 연애 팁\n삭제\n## 6. 다음\n유지",
      "### 5-2. 연애팁\n삭제\n### 6. 다음\n유지",
      "###   5-2   연애 팁   \n삭제",
    ];

    variants.forEach((markdown) => {
      const result = stripLoveTipSection(markdown);
      expect(result.removed).toBe(true);
      expect(result.markdown).not.toContain("삭제");
      expect(result.markdown).not.toMatch(/5-2\s*\.?.*연애\s*팁/);
    });
  });

  it("연애 팁 제거 시 5-1 올해 연애운은 유지한다", () => {
    const result = stripLoveTipSection("## 5-1. 올해 연애운\n유지\n\n## 5-2. 연애 팁\n삭제");

    expect(result.markdown).toContain("## 5-1. 올해 연애운\n유지");
    expect(result.markdown).not.toContain("삭제");
  });

  it("연애 팁 섹션이 없으면 원문을 그대로 반환하고 반복 실행해도 동일하다", () => {
    const markdown = "## 5. 앞으로 다가올 연애 기회\n본문\n\n## 6. 마무리\n끝";
    const first = stripLoveTipSection(markdown);
    const second = stripLoveTipSection(first.markdown);

    expect(first).toEqual({ removed: false, markdown });
    expect(second).toEqual({ removed: false, markdown });
  });
});
