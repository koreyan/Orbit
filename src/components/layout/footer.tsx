import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-background/50 py-8 md:py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          {/* TODO: 실제 사업자 정보로 업데이트 필요 */}
          <p className="text-sm text-muted-foreground">
            상호명: Orbit | 대표: 홍길동 | 사업자등록번호: 000-00-00000
          </p>
          <p className="text-sm text-muted-foreground">
            이메일: support@orbit.com | 통신판매업신고번호: 제 2026-서울강남-0000호
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            이용약관
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            개인정보처리방침
          </Link>
          <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            문의하기
          </Link>
        </div>
      </div>
    </footer>
  );
}
