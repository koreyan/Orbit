import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StarBackground } from "@/components/ui/star-background";

export default function ForbiddenPage() {
  return (
    <div className="relative min-h-screen bg-[#05050a] flex items-center justify-center p-4 overflow-hidden">
      <StarBackground />
      <div className="relative z-10 text-center bg-white/[0.02] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">비공개 리포트입니다</h1>
        <p className="text-white/60 mb-8">작성자가 아직 이 리포트를 공유하지 않았습니다.<br/>링크를 전달받으셨다면 작성자에게 공유 권한 개방을 요청해주세요.</p>
        <Link href="/">
          <Button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white border-none rounded-xl">
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
