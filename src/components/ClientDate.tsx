"use client";

import { formatKoreanDateTime } from "@/lib/format/korean-date-time";

interface ClientDateProps {
  dateString: string;
}

export default function ClientDate({ dateString }: ClientDateProps) {
  return <span suppressHydrationWarning>{formatKoreanDateTime(dateString)}</span>;
}
