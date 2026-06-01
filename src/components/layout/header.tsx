import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* Logo: Cosmic Orange Color applied via text-primary */}
          <span className="text-2xl font-extrabold tracking-tighter text-primary">Orbit</span>
        </Link>
        <nav className="flex flex-1 items-center justify-end space-x-6">
          <Link 
            href="/reports" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            내 별빛 이야기 확인하러 가기
          </Link>
        </nav>
      </div>
    </header>
  );
}
