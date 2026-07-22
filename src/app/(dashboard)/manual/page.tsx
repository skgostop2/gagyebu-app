import { Card } from "@/components/ui/Card";

interface ManualSection {
  title: string;
  body: React.ReactNode;
}

const gettingStarted: ManualSection[] = [
  {
    title: "1. 회원가입 · 로그인",
    body: (
      <p>
        이메일과 비밀번호로 가입합니다. 관리자가 이메일 인증을 켜둔 경우 가입 후 받은 메일의 링크를
        눌러야 로그인이 됩니다. 비밀번호를 잊었다면 로그인 화면의 &quot;비밀번호를 잊으셨나요?&quot;에서
        재설정할 수 있습니다.
      </p>
    ),
  },
  {
    title: "2. 가정 만들기 또는 참여하기",
    body: (
      <p>
        처음 로그인하면 가정이 없는 경우 자동으로 가정 만들기 화면으로 이동합니다. 우리 가족이 이미
        가정을 만들었다면, 가정을 만든 사람에게 초대코드를 받아 &quot;기존 가정 참여하기&quot;에서
        입력하면 됩니다.
      </p>
    ),
  },
  {
    title: "3. 가족 초대하기",
    body: (
      <p>
        가족관리 메뉴에서 소유자·관리자는 초대코드를 만들 수 있습니다. 코드는 7일간 유효하고 1회만
        사용할 수 있습니다. 만든 코드를 가족에게 문자나 메신저로 전달하면, 가족이 회원가입 후 그
        코드로 같은 가정에 들어올 수 있습니다.
      </p>
    ),
  },
];

const roles: { role: string; desc: string }[] = [
  { role: "가정 소유자", desc: "가정 생성, 정보 변경, 구성원 초대·삭제, 요금제 관리, 가정 삭제, 소유권 이전까지 모두 가능합니다." },
  { role: "관리자", desc: "구성원 초대, 항목·예산 관리, 전체 거래 수정·삭제, 월 마감을 할 수 있습니다." },
  { role: "일반 구성원", desc: "본인 수입·지출을 등록하고, 본인이 등록한 거래만 수정·삭제할 수 있습니다." },
  { role: "조회 전용", desc: "허용된 데이터를 볼 수만 있고 등록·수정·삭제는 할 수 없습니다." },
];

interface MenuStatus {
  label: string;
  status: "사용 가능" | "준비 중";
  desc: string;
}

const menus: MenuStatus[] = [
  { label: "홈 (대시보드)", status: "사용 가능", desc: "이번 달 수입·지출·저축·순자산 요약과 핵심 권고를 보여줍니다. 지금은 예시 데이터로 화면 구조만 확인할 수 있습니다." },
  { label: "가족관리", status: "사용 가능", desc: "가족 구성원과 권한을 확인하고 초대코드를 만듭니다." },
  { label: "수입·지출", status: "준비 중", desc: "수입·지출 등록과 조회. 다음 단계에서 실제 등록 기능이 연결됩니다." },
  { label: "카드", status: "준비 중", desc: "카드 등록, 카드 사용내역, 할부 관리." },
  { label: "관리비", status: "준비 중", desc: "아파트 관리비 등록과 변화 분석." },
  { label: "예산", status: "준비 중", desc: "가족·개인·항목별 예산과 초과 알림." },
  { label: "저축·투자 / 자산·부채", status: "준비 중", desc: "자산·부채 현황과 순자산 자동계산." },
  { label: "미래수입", status: "준비 중", desc: "퇴사·이직·휴직 등 수입 감소 시나리오 분석." },
  { label: "기본권고 · AI권고", status: "준비 중", desc: "규칙 기반 재정 조언과, 요청 시 AI 상세 분석." },
  { label: "보고서", status: "준비 중", desc: "월간·미래수입·자산부채 PDF 보고서." },
];

const faqs: { q: string; a: string }[] = [
  { q: "이메일 인증 메일이 안 와요", a: "스팸함을 확인해 보세요. 그래도 없으면 관리자에게 이메일 인증 설정을 확인해 달라고 요청하세요." },
  { q: "초대코드가 안 먹혀요", a: "초대코드는 발급 후 7일이 지나거나 이미 한 번 사용되면 무효화됩니다. 가정 소유자·관리자에게 새 코드를 요청하세요." },
  { q: "한 사람이 여러 가정에 들어갈 수 있나요", a: "구조상 지원 예정이며, 지금 버전에서는 한 계정당 하나의 가정만 사용할 수 있습니다." },
  { q: "제 자산이나 수입을 다른 가족이 못 보게 할 수 있나요", a: "공개범위 설정(가족 전체 공개 / 금액만 공개 / 소유자·관리자만 공개 / 소유자만 공개)이 예정되어 있습니다. 아직 화면에 연결되지 않았습니다." },
];

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">사용 설명서</h1>
        <p className="mt-1 text-sm text-text-secondary">
          지금 무엇을 할 수 있고, 무엇이 아직 준비 중인지 안내합니다.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">시작하기</h2>
        {gettingStarted.map((s) => (
          <Card key={s.title}>
            <h3 className="mb-1 text-sm font-medium text-text-primary">{s.title}</h3>
            <div className="text-sm text-text-secondary">{s.body}</div>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">권한 안내</h2>
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {roles.map((r) => (
              <li key={r.role} className="px-4 py-3">
                <div className="text-sm font-medium text-text-primary">{r.role}</div>
                <div className="mt-0.5 text-xs text-text-secondary">{r.desc}</div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">메뉴 안내</h2>
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {menus.map((m) => (
              <li key={m.label} className="flex items-start justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-text-primary">{m.label}</div>
                  <div className="mt-0.5 text-xs text-text-secondary">{m.desc}</div>
                </div>
                <span
                  className={
                    m.status === "사용 가능"
                      ? "shrink-0 rounded-full bg-status-stable/15 px-2.5 py-1 text-xs font-medium text-status-stable"
                      : "shrink-0 rounded-full bg-status-caution/15 px-2.5 py-1 text-xs font-medium text-status-caution"
                  }
                >
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">자주 묻는 질문</h2>
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {faqs.map((f) => (
              <li key={f.q} className="px-4 py-3">
                <div className="text-sm font-medium text-text-primary">{f.q}</div>
                <div className="mt-0.5 text-xs text-text-secondary">{f.a}</div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="text-center text-xs text-text-muted">
        이 페이지는 개발 단계에 맞춰 계속 업데이트됩니다. 오류 신고·문의 기능은 이후 단계에서 추가됩니다.
      </p>
    </div>
  );
}
