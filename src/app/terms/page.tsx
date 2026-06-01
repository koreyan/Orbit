export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">이용약관</h1>
      <div className="prose prose-invert max-w-none text-muted-foreground">
        <p>본 약관은 Orbit 서비스의 이용 조건 및 절차에 관한 사항을 규정합니다.</p>
        {/* TODO: 실제 이용약관 내용으로 업데이트 필요 */}
        <p className="mt-4">
          제1조 (목적)<br />
          이 약관은 Orbit이 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
        </p>
      </div>
    </div>
  );
}
