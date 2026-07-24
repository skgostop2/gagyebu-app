import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
