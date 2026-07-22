import type { LucideIcon } from "lucide-react";
import {
  Home,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  MoreHorizontal,
  Receipt,
  CreditCard,
  Building2,
  PiggyBank,
  TrendingUp,
  Landmark,
  Lightbulb,
  FileText,
  Users,
  Settings,
  HelpCircle,
  Bell,
  Sparkles,
  MessageCircleQuestion,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** 모바일 하단 메뉴 (요구사항 63) — 5개 고정 */
export const mobileNavItems: NavItem[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/transactions", label: "거래", icon: ArrowLeftRight },
  { href: "/recommendations", label: "분석", icon: BarChart3 },
  { href: "/assets-liabilities", label: "자산", icon: Wallet },
  { href: "/settings", label: "더보기", icon: MoreHorizontal },
];

/** PC 좌측 사이드바 (요구사항 63) — 관련 메뉴 그룹화 */
export const sidebarNavGroups: NavGroup[] = [
  {
    label: "개요",
    items: [{ href: "/", label: "대시보드", icon: Home }],
  },
  {
    label: "수입·지출",
    items: [
      { href: "/transactions", label: "수입·지출", icon: Receipt },
      { href: "/cards", label: "카드", icon: CreditCard },
      { href: "/maintenance-fee", label: "관리비", icon: Building2 },
      { href: "/budget", label: "예산", icon: Wallet },
    ],
  },
  {
    label: "자산관리",
    items: [
      { href: "/savings-investments", label: "저축·투자", icon: PiggyBank },
      { href: "/assets-liabilities", label: "자산·부채", icon: Landmark },
    ],
  },
  {
    label: "미래·권고",
    items: [
      { href: "/income-scenarios", label: "미래수입", icon: TrendingUp },
      { href: "/recommendations", label: "기본권고 · AI권고", icon: Lightbulb },
      { href: "/reports", label: "보고서", icon: FileText },
    ],
  },
  {
    label: "가정",
    items: [
      { href: "/household", label: "가족관리", icon: Users },
      { href: "/notifications", label: "알림", icon: Bell },
      { href: "/pricing", label: "요금제", icon: Sparkles },
      { href: "/inquiries", label: "문의하기", icon: MessageCircleQuestion },
      { href: "/manual", label: "사용 설명서", icon: HelpCircle },
      { href: "/settings", label: "설정", icon: Settings },
    ],
  },
];
