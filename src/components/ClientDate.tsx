"use client";

interface ClientDateProps {
  dateString: string;
}

export default function ClientDate({ dateString }: ClientDateProps) {
  const formattedDate = new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return <span suppressHydrationWarning>{formattedDate}</span>;
}
