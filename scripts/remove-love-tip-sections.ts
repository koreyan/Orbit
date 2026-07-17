#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

interface CleanupReportRow {
  id: string;
  order_id: string;
  status: string | null;
  generated_at: string | null;
  content: unknown;
}

interface CleanupTarget {
  reportId: string;
  orderId: string;
  status: string | null;
  generatedAt: string | null;
  originalContent: Record<string, unknown>;
  nextContent: Record<string, unknown>;
  removedHeading: string;
  beforeLength: number;
  afterLength: number;
}

interface CliOptions {
  apply: boolean;
  expectedCount: number | null;
  envFile: string;
}

const parseCliOptions = (argv: string[]): CliOptions => {
  const options: CliOptions = { apply: false, expectedCount: null, envFile: ".env.local" };

  argv.forEach((arg) => {
    if (arg === "--apply") {
      options.apply = true;
      return;
    }
    if (arg.startsWith("--expected-count=")) {
      options.expectedCount = Number(arg.slice("--expected-count=".length));
      return;
    }
    if (arg.startsWith("--env-file=")) {
      options.envFile = arg.slice("--env-file=".length);
    }
  });

  if (options.apply) {
    const expectedCount = options.expectedCount;
    if (expectedCount === null || !Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error("--apply 실행에는 --expected-count=N이 필요합니다.");
    }
  }

  return options;
};

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} 환경변수가 필요합니다.`);
  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const stripLoveTipSection = (markdown: string): { markdown: string; removed: boolean } => {
  const sectionHeadingPattern = /^(#{1,6})\s*5-2\s*\.?\s*연애\s*팁(?:\s*\([^)]*\))?\s*$/gim;
  const match = sectionHeadingPattern.exec(markdown);
  if (!match) return { markdown, removed: false };

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
  return { markdown: [previousSection, nextSection].filter(Boolean).join("\n\n"), removed: true };
};

const findLoveTipHeading = (markdown: string): string => {
  return markdown.split("\n").find((line) => /^#{1,6}\s*5-2\s*\.?\s*연애\s*팁/i.test(line.trim()))?.trim() ?? "";
};

const buildLoveTipCleanupTargets = (rows: CleanupReportRow[]): CleanupTarget[] => {
  return rows.flatMap((row) => {
    if (!isRecord(row.content) || typeof row.content.markdown !== "string") return [];
    const stripped = stripLoveTipSection(row.content.markdown);
    if (!stripped.removed || stripped.markdown === row.content.markdown) return [];

    return [{
      reportId: row.id,
      orderId: row.order_id,
      status: row.status,
      generatedAt: row.generated_at,
      originalContent: row.content,
      nextContent: { ...row.content, markdown: stripped.markdown },
      removedHeading: findLoveTipHeading(row.content.markdown),
      beforeLength: row.content.markdown.length,
      afterLength: stripped.markdown.length,
    }];
  });
};

const writeBackup = (targets: CleanupTarget[]): { path: string; sha256: string } => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = join(process.cwd(), "data", "backups");
  mkdirSync(backupDir, { recursive: true });

  const backupPath = join(backupDir, `love-tip-removal-${timestamp}.json`);
  const payload = JSON.stringify({
    createdAt: new Date().toISOString(),
    targetCount: targets.length,
    reports: targets.map((target) => ({
      reportId: target.reportId,
      orderId: target.orderId,
      status: target.status,
      generatedAt: target.generatedAt,
      content: target.originalContent,
    })),
  }, null, 2);

  writeFileSync(backupPath, payload, { mode: 0o600 });
  chmodSync(backupPath, 0o600);

  return {
    path: backupPath,
    sha256: createHash("sha256").update(payload).digest("hex"),
  };
};

const main = async () => {
  const options = parseCliOptions(process.argv.slice(2));
  loadEnv({ path: options.envFile });

  const supabase = createClient(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"));
  const { data, error } = await supabase
    .from("reports")
    .select("id, order_id, status, generated_at, content, orders!inner(theme)")
    .eq("orders.theme", "love")
    .not("content->>markdown", "is", null);

  if (error) throw error;

  const rows: CleanupReportRow[] = (data ?? []).map((row) => ({
    id: row.id,
    order_id: row.order_id,
    status: row.status,
    generated_at: row.generated_at,
    content: row.content,
  }));
  const targets = buildLoveTipCleanupTargets(rows);
  const backup = writeBackup(targets);

  console.log(JSON.stringify({
    mode: options.apply ? "apply" : "dry-run",
    targetCount: targets.length,
    backupPath: backup.path,
    backupSha256: backup.sha256,
    targets: targets.map((target) => ({
      reportId: target.reportId,
      orderId: target.orderId,
      removedHeading: target.removedHeading,
      beforeLength: target.beforeLength,
      afterLength: target.afterLength,
    })),
  }, null, 2));

  if (!options.apply) return;
  const expectedCount = options.expectedCount;
  if (expectedCount === null || targets.length !== expectedCount) {
    throw new Error(`대상 건수 불일치: expected=${expectedCount}, actual=${targets.length}`);
  }

  const failures: { reportId: string; error: string }[] = [];
  let successCount = 0;

  for (const target of targets) {
    const { error: updateError } = await supabase
      .from("reports")
      .update({ content: target.nextContent })
      .eq("id", target.reportId);

    if (updateError) {
      failures.push({ reportId: target.reportId, error: updateError.message });
      continue;
    }

    const { data: verifyRow, error: verifyError } = await supabase
      .from("reports")
      .select("content")
      .eq("id", target.reportId)
      .single();

    if (verifyError) {
      failures.push({ reportId: target.reportId, error: verifyError.message });
      continue;
    }

    const [remaining] = buildLoveTipCleanupTargets([{
      id: target.reportId,
      order_id: target.orderId,
      status: target.status,
      generated_at: target.generatedAt,
      content: verifyRow.content,
    }]);

    if (remaining) {
      failures.push({ reportId: target.reportId, error: "5-2 연애 팁 섹션이 재조회 후에도 남아 있습니다." });
      continue;
    }

    successCount += 1;
  }

  console.log(JSON.stringify({
    mode: "apply-result",
    successCount,
    failureCount: failures.length,
    failures,
  }, null, 2));

  if (failures.length > 0) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
