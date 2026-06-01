"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.back()}
      className="absolute top-6 left-4 md:left-8 z-50 text-white/60 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
      aria-label="뒤로 가기"
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}
