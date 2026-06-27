"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateReportAction } from "@/app/actions/report";
import { getErrorMessage } from "@/lib/error-utils";

export default function RegenerateButton({ orderId }: { orderId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleRegenerate = async () => {
    if (!confirm("정말로 결과를 재생성하시겠습니까? (약 1분 정도 소요되며 기존 내용은 덮어씌워집니다.)")) return;
    
    setIsLoading(true);
    try {
      await generateReportAction(orderId);
      if (isMounted.current) {
        alert(`해당 주문(${orderId.split('-')[0]})의 결과 재생성이 완료되었습니다!`);
        router.refresh();
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        alert(`재생성 실패: ` + getErrorMessage(error));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <button 
      onClick={handleRegenerate}
      disabled={isLoading}
      className="w-full px-4 py-2.5 text-sm font-medium bg-[#FF6B35] hover:bg-[#FFAB40] text-white rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
    >
      {isLoading ? "재생성 중... (창 유지)" : "결과 재생성하기"}
    </button>
  );
}
