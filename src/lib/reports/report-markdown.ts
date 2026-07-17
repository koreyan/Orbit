export interface MarkdownSection {
  title: string;
  body: string;
}

export interface StripSectionResult {
  markdown: string;
  removed: boolean;
}

export const cleanMarkdown = (text?: string): string => {
  if (!text) return "";
  let cleaned = text.trim();
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.substring("```markdown".length).trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring("```".length).trim();
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - "```".length).trim();
  }
  return cleaned;
};

export const stripLoveTipSection = (markdown: string): StripSectionResult => {
  const sectionHeadingPattern = /^(#{1,6})\s*5-2\s*\.?\s*연애\s*팁(?:\s*\([^)]*\))?\s*$/gim;
  const match = sectionHeadingPattern.exec(markdown);

  if (!match) {
    return { markdown, removed: false };
  }

  const headingLevel = match[1].length;
  const sectionStart = match.index;
  const afterHeading = sectionStart + match[0].length;
  const rest = markdown.slice(afterHeading);
  const nextHeadingPattern = /^(#{1,6})\s+.+$/gm;
  let sectionEnd = markdown.length;
  let nextMatch: RegExpExecArray | null;

  while ((nextMatch = nextHeadingPattern.exec(rest)) !== null) {
    if (nextMatch[1].length <= headingLevel) {
      sectionEnd = afterHeading + nextMatch.index;
      break;
    }
  }

  const nextSection = markdown.slice(sectionEnd).replace(/^\n+/, "");
  const previousSection = markdown.slice(0, sectionStart).replace(/\n+$/, "");
  const stripped = [previousSection, nextSection].filter(Boolean).join("\n\n");

  return {
    markdown: stripped,
    removed: true,
  };
};

export const splitMarkdownSections = (markdown: string): MarkdownSection[] => {
  const normalized = markdown.trim();
  if (!normalized) return [];

  const numberedMatches = Array.from(normalized.matchAll(/^\d+\.\s+(.+)$/gm));
  const headingMatches = numberedMatches.length > 0
    ? numberedMatches
    : Array.from(normalized.matchAll(/^##\s+(.+)$/gm)).length > 0
      ? Array.from(normalized.matchAll(/^##\s+(.+)$/gm))
      : Array.from(normalized.matchAll(/^#\s+(.+)$/gm));

  if (headingMatches.length === 0) {
    return [{ title: "나의 별빛 이야기", body: normalized }];
  }

  const intro = normalized
    .slice(0, headingMatches[0].index ?? 0)
    .replace(/^#\s+.+$/gm, "")
    .trim();
  const sections: MarkdownSection[] = [];

  if (intro) {
    sections.push({ title: "요약", body: intro });
  }

  headingMatches.forEach((match, index) => {
    const headingStart = match.index ?? 0;
    const bodyStart = headingStart + match[0].length;
    const nextHeadingStart = headingMatches[index + 1]?.index ?? normalized.length;
    const title = match[1].replace(/^[0-9]+[.)]\s*/, "").trim();
    const body = normalized.slice(bodyStart, nextHeadingStart).trim();

    if (!body) return;

    sections.push({
      title: title || `항목 ${sections.length + 1}`,
      body,
    });
  });

  return sections.length > 0 ? sections : [{ title: "나의 별빛 이야기", body: normalized }];
};
