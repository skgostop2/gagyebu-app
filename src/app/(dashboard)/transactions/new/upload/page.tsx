import { redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { PhotoUploadForm } from "@/components/transactions/PhotoUploadForm";

/** 사진·PDF로 거래 등록 (10단계, 요구사항: 업로드→분석→검토→확정 흐름) */
export default async function UploadTransactionPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) redirect("/household/new");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", membership.householdId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">사진·PDF로 거래 등록</h1>
        <p className="mt-1 text-sm text-text-secondary">
          영수증 사진이나 PDF를 첨부하고, 금액·일시 등 거래 정보를 직접 입력해 등록합니다. 자동 인식(AI 분석)은 이후
          단계에서 연결됩니다.
        </p>
      </div>
      <PhotoUploadForm householdId={membership.householdId} categories={categories ?? []} />
    </div>
  );
}
