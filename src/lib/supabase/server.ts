import "server-only";
import { cache } from "react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import type { User } from "@supabase/supabase-js";

/** 서버 컴포넌트 / 서버 액션에서 사용하는 Supabase 클라이언트 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출된 경우 쿠키를 쓸 수 없다.
            // 세션 갱신은 middleware.ts가 담당하므로 무시해도 된다.
          }
        },
      },
    }
  );
}

/**
 * 로그인한 사용자 조회를 요청(request) 단위로 캐시한다(React `cache()`).
 * 레이아웃·상단바·페이지 등 여러 서버 컴포넌트가 같은 요청 안에서 각자 `auth.getUser()`를
 * 호출하면 매번 Supabase Auth로 네트워크 왕복이 발생해 화면 전환이 느려진다 — 이 헬퍼를 쓰면
 * 같은 요청 내에서는 실제 호출이 한 번만 일어나고 나머지는 캐시된 결과를 재사용한다.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
