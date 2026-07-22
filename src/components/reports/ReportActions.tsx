"use client";

import { useState } from "react";
import { Printer, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReportActionsProps {
  shareTitle: string;
  shareText: string;
}

/**
 * PDF 보고서·공유 (12단계) — 별도 PDF 생성 라이브러리 없이 브라우저 인쇄 기능으로 PDF 저장을 지원하고
 * (인쇄 시 사이드바·상단바·하단탭은 자동으로 숨겨짐), Web Share API로 요약을 공유한다.
 * Web Share API를 지원하지 않는 환경(대부분의 데스크톱 브라우저)에서는 클립보드 복사로 대체한다.
 */
export function ReportActions({ shareTitle, shareText }: ReportActionsProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const onPrint = () => {
    window.print();
  };

  const canWebShare = typeof navigator !== "undefined" && "share" in navigator;

  const onShare = async () => {
    setNotice(null);
    if (canWebShare) {
      try {
        await navigator.share({ title: shareTitle, text: shareText });
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 조용히 무시한다.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setNotice("요약이 클립보드에 복사되었습니다. 카카오톡 등에 붙여넣어 공유하세요.");
    } catch {
      setNotice("공유 기능을 사용할 수 없습니다.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="secondary" onClick={onPrint}>
        <Printer size={16} /> PDF로 저장 / 인쇄
      </Button>
      <Button variant="secondary" onClick={onShare}>
        {canWebShare ? <Share2 size={16} /> : <Copy size={16} />}
        공유하기
      </Button>
      {notice && <span className="text-xs text-status-stable">{notice}</span>}
    </div>
  );
}
