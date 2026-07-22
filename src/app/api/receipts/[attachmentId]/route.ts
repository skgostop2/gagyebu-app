import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 영수증 첨부파일의 서명된 URL로 리다이렉트한다 (RLS로 가정 구성원만 접근 가능) */
export async function GET(_request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: attachment } = await supabase
    .from("transaction_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!attachment) {
    return NextResponse.json({ error: "첨부파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(attachment.storage_path, 60);

  if (error || !signed) {
    return NextResponse.json({ error: "파일 URL을 생성하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
