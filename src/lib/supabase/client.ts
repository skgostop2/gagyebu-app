"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** 클라이언트 컴포넌트에서 사용하는 Supabase 클라이언트 (anon/publishable key만 사용) */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
