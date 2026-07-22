import "server-only";
import type { SmsProvider, SmsSendResult } from "../provider";

/** 1단계용 목업 — 실제 발송 없이 서버 콘솔에만 기록한다. */
export class MockSmsProvider implements SmsProvider {
  async send(phoneE164: string, code: string): Promise<SmsSendResult> {
    console.log(`[MockSmsProvider] ${phoneE164} 로 인증번호 ${code} 발송(모의)`);
    return { ok: true, providerMessageId: `mock-${Date.now()}` };
  }
}
