/**
 * SMS 발송 인터페이스 — 공급자 교체 가능 구조 (요구사항 10, 아키텍처 문서 6번)
 * 실제 구현체는 서버에서만 import한다. 이 파일과 구현체는 클라이언트 번들에 포함되면 안 된다.
 */
import "server-only";

export interface SmsSendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(phoneE164: string, code: string): Promise<SmsSendResult>;
}

/** 환경변수(SMS_PROVIDER)로 구현체를 선택한다. 1단계에서는 mock만 존재한다. */
export async function getSmsProvider(): Promise<SmsProvider> {
  const providerKey = process.env.SMS_PROVIDER ?? "mock";

  switch (providerKey) {
    case "mock":
    default: {
      const { MockSmsProvider } = await import("./providers/mock");
      return new MockSmsProvider();
    }
  }
}
