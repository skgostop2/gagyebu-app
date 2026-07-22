import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PDF 생성, 이미지·PDF 분석, AI 호출 모듈은 이후 단계에서
  // 요청 시 동적 로딩(next/dynamic)으로 연결한다. 여기서는 기본 설정만 유지한다.
};

export default nextConfig;
