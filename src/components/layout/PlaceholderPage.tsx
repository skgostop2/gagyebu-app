import { Card } from "@/components/ui/Card";

/**
 * 아직 데이터 연동 전인 상세 화면용 자리표시자.
 * "빈 화면"이 아니라 어떤 기능이 어느 단계에서 연결되는지 명시해 원칙 5를 지킨다.
 */
export function PlaceholderPage({
  title,
  description,
  nextStep,
}: {
  title: string;
  description: string;
  nextStep: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-text-primary">{title}</h1>
      <p className="mb-6 text-sm text-text-secondary">{description}</p>
      <Card>
        <p className="text-sm text-text-secondary">
          이 화면은 1단계(구조 설계) 산출물입니다. 실제 등록·수정·삭제·계산 기능은{" "}
          <span className="text-text-primary">{nextStep}</span>에서 연결됩니다.
        </p>
      </Card>
    </div>
  );
}
