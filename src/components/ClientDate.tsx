"use client";

import { useEffect, useState } from "react";

interface ClientDateProps {
  dateString: string;
}

export default function ClientDate({ dateString }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // 브라우저의 로컬 타임존과 언어 설정을 따름
    const dateStr = new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setFormattedDate(dateStr);
  }, [dateString]);

  if (!formattedDate) {
    return <span className="opacity-0">0000. 00. 00. 오후 00:00</span>;
  }

  return <span>{formattedDate}</span>;
}
