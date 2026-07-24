import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 로그인 없이 접근 가능한 경로 (요구사항 11) */
const PUBLIC_PATHS = ["/login", "/signup", "/verify-email", "/reset-password", "/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** 모든 요청에서 세션을 갱신하고, 비로그인 사용자를 보호된 경로에서 /login으로 보낸다 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()는 매 요청마다 Supabase Auth 서버로 네트워크 왕복을 해서(재검증) 느리다.
  // 미들웨어는 "로그인 안 한 사용자를 /login으로 보내는" UX 게이트일 뿐, 실제 데이터 접근 권한은
  // 각 서버 컴포넌트·API 라우트가 getAuthUser()로 다시 확인하고 무엇보다 Supabase RLS가 최종적으로
  // 강제하므로, 여기서는 쿠키에 담긴 세션을 네트워크 호출 없이 로컬 검증하는 getSession()으로 충분하다.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  if (!session?.user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
