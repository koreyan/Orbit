export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">개인정보처리방침</h1>
      <div className="prose prose-invert max-w-none text-muted-foreground">
        <p>Orbit 서비스는 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다.</p>
        {/* TODO: 실제 개인정보처리방침 내용으로 업데이트 필요 */}
        <p className="mt-4">
          제1조 (개인정보의 수집 및 이용 목적)<br />
          회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법령에 따라 사전 동의를 구합니다.
        </p>
      </div>
    </div>
  );
}
