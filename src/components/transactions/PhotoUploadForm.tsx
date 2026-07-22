"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import type { Tables } from "@/lib/supabase/database.types";

type Category = Tables<"categories">;

interface PhotoUploadFormProps {
  householdId: string;
  categories: Category[];
}

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * 사진·PDF 거래등록 (10단계) — 업로드 → 검토 → 확정 흐름.
 * 지금은 OCR/AI 분석 없이 파일만 첨부해 두고 사용자가 직접 금액·일시 등을 입력한다.
 * 실제 AI 분석(자동 인식)은 11단계에서 연결될 예정이다.
 */
export function PhotoUploadForm({ householdId, categories }: PhotoUploadFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ id: string; filename: string } | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("이미지(JPG/PNG/WEBP) 또는 PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("파일 크기는 10MB 이하만 업로드할 수 있습니다.");
      return;
    }

    if (selected.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setUploading(false);
      return;
    }

    const path = `${householdId}/${crypto.randomUUID()}-${selected.name}`;
    const { error: uploadError } = await supabase.storage.from("receipts").upload(path, selected);

    if (uploadError) {
      setError("업로드 중 문제가 발생했습니다. 다시 시도해 주세요.");
      setUploading(false);
      return;
    }

    const { data: attachmentRow, error: insertError } = await supabase
      .from("transaction_attachments")
      .insert({
        household_id: householdId,
        storage_path: path,
        original_filename: selected.name,
        mime_type: selected.type,
        created_by: user.id,
      })
      .select("id")
      .single();

    setUploading(false);
    if (insertError || !attachmentRow) {
      setError("첨부파일 등록 중 문제가 발생했습니다.");
      return;
    }

    setAttachment({ id: attachmentRow.id, filename: selected.name });
  };

  if (!attachment) {
    return (
      <Card>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-center hover:border-neon-blue">
          <Upload size={28} className="text-text-muted" />
          <span className="text-sm text-text-secondary">
            {uploading ? "업로드 중..." : "영수증 사진 또는 PDF 파일을 선택하세요"}
          </span>
          <span className="text-xs text-text-muted">JPG · PNG · WEBP · PDF, 최대 10MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={onFileChange}
          />
        </label>
        {error && <p className="mt-3 text-sm text-status-danger">{error}</p>}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="영수증 미리보기" className="h-20 w-20 rounded-lg object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-bg-elevated">
              <FileText size={28} className="text-text-muted" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm text-text-primary">{attachment.filename}</p>
            <p className="text-xs text-status-stable">업로드 완료 — 아래에서 거래 정보를 확인하고 등록하세요.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">거래 정보 검토·확정</h2>
        <TransactionForm
          householdId={householdId}
          categories={categories}
          mode="create"
          pendingAttachmentId={attachment.id}
        />
      </Card>
    </div>
  );
}
