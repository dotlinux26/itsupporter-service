import config from '../config/index.js';
import { getSystemSettings } from './settingsService.js';
import logger from '../utils/logger.js';

export async function verifyTurnstile(
  token?: string | null,
  clientIp?: string,
  expectedAction = 'booking'
): Promise<{ success: boolean; error?: string }> {
  const settings = getSystemSettings();
  const enabled = settings.turnstileEnabled ?? config.turnstile.enabled;
  const secret = settings.turnstileSecret || config.turnstile.secret;

  // Nếu Turnstile bị tắt hoặc chưa cấu hình secret -> tự động bypass
  if (!enabled || !secret) {
    return { success: true };
  }

  if (typeof token !== 'string' || token.trim().length === 0 || token.length > 2048) {
    return {
      success: false,
      error: 'Mã xác thực bảo vệ (Turnstile) không hợp lệ hoặc bị thiếu. Vui lòng thử lại.',
    };
  }

  try {
    const bodyParams = new URLSearchParams({
      secret,
      response: token.trim(),
    });
    if (clientIp) {
      bodyParams.append('remoteip', clientIp);
    }

    const res = await fetch(config.turnstile.verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Cloudflare Turnstile HTTP error status: ${res.status}`);
    }

    const result = (await res.json()) as {
      success: boolean;
      action?: string;
      hostname?: string;
      'error-codes'?: string[];
    };

    if (!result.success) {
      logger.warn({ errorCodes: result['error-codes'], clientIp }, 'Cloudflare Turnstile verification rejected');
      return {
        success: false,
        error: 'Xác thực Turnstile không thành công. Phát hiện hành vi tự động hoặc token hết hạn.',
      };
    }

    // Kiểm tra action nếu widget gửi kèm action
    if (result.action && result.action !== expectedAction) {
      logger.warn({ action: result.action, expectedAction }, 'Cloudflare Turnstile action mismatch');
      return {
        success: false,
        error: 'Hành động xác thực bảo vệ không khớp.',
      };
    }

    return { success: true };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to verify Turnstile token');
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ xác thực Cloudflare Turnstile. Vui lòng thử lại sau ít phút.',
    };
  }
}
