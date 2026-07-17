export interface ReportGenerationUpdateResult {
  updateErrorMessage?: string;
  updatedRows: unknown[] | null;
}

export const assertReportGenerationUpdateApplied = ({
  updateErrorMessage,
  updatedRows,
}: ReportGenerationUpdateResult): void => {
  if (updateErrorMessage) {
    throw new Error(`리포트 저장 실패: ${updateErrorMessage}`);
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error("리포트 저장 결과가 비어 있습니다.");
  }
};

export const buildReportFailureNotification = ({
  orderId,
  reason,
  error,
}: {
  orderId: string;
  reason: string;
  error: unknown;
}): string => {
  const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
  return `❌ <b>[리포트 생성 실패]</b>\n주문번호: <code>${orderId}</code>\n사유: ${reason}\n에러: ${errorMessage}`;
};
