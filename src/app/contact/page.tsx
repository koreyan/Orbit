export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">문의하기</h1>
      <div className="prose prose-invert max-w-none text-muted-foreground">
        <p>Orbit 서비스에 대한 문의사항이 있으신가요?</p>
        {/* TODO: 실제 문의하기 폼 또는 안내 내용으로 업데이트 필요 */}
        <div className="mt-8 p-6 bg-secondary rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4 text-foreground">고객센터</h2>
          <ul className="space-y-2">
            <li><strong>이메일:</strong> support@orbit.com</li>
            <li><strong>전화번호:</strong> 02-0000-0000</li>
            <li><strong>운영시간:</strong> 평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
