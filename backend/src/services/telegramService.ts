import { getDb } from '../config/database.js';
import config from '../config/index.js';
import { getSystemSettings, setSetting } from './settingsService.js';
import logger from '../utils/logger.js';

/**
 * Thoát các ký tự đặc biệt trong HTML để ngăn Telegram parse lỗi hoặc HTML injection
 */
export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Kiểm tra và chuẩn hóa URL Telegram API để ngăn chặn tấn công SSRF
 */
function getSafeTelegramApiUrl(rawUrl?: string): string {
  const fallback = 'https://api.telegram.org';
  if (!rawUrl) return fallback;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return fallback;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.2') ||
      hostname.startsWith('172.3')
    ) {
      return fallback;
    }
    return rawUrl;
  } catch {
    return fallback;
  }
}

import { Agent } from 'undici';

// Ép Undici Agent sử dụng thuần IPv4 (family: 4) để tránh Happy Eyeballs race IPv6 timeout trên môi trường Linux
const telegramAgent = new Agent({
  connect: {
    autoSelectFamily: false,
    family: 4,
    timeout: 15000,
  },
});

/**
 * Gửi tin nhắn HTML qua Telegram Bot API
 */
export async function sendTelegramMessage(
  text: string,
  customChatId?: string,
  retryCount = 1
): Promise<{ success: boolean; error?: string }> {
  const settings = getSystemSettings();
  const enabled = settings.telegramEnabled;
  const botToken = settings.telegramBotToken?.trim();
  const chatId = customChatId?.trim() || settings.telegramChatId?.trim();
  const apiUrl = getSafeTelegramApiUrl(settings.telegramApiUrl?.trim());

  if (!enabled) {
    return { success: false, error: 'Telegram bot hiện đang bị tắt.' };
  }
  if (!botToken) {
    return { success: false, error: 'Chưa cấu hình Telegram Bot Token.' };
  }
  if (!chatId) {
    return { success: false, error: 'Chưa cấu hình Telegram Chat ID nhóm/kênh tiếp nhận.' };
  }

  const endpoint = `${apiUrl.replace(/\/+$/, '')}/bot${botToken}/sendMessage`;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(15000),
        dispatcher: telegramAgent,
      } as any);

      const data = (await response.json()) as {
        ok: boolean;
        description?: string;
        parameters?: { migrate_to_chat_id?: number | string };
      };
      if (!data.ok) {
        // Tự động nhận diện và cập nhật khi Group được nâng cấp lên Supergroup
        if (data.parameters?.migrate_to_chat_id) {
          const newChatId = String(data.parameters.migrate_to_chat_id);
          logger.info({ oldChatId: chatId, newChatId }, 'Auto-migrating Telegram Group to Supergroup ID');
          try {
            getDb()
              .prepare(
                "INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('telegram_chat_id', ?, datetime('now'))"
              )
              .run(newChatId);
          } catch (e: any) {
            logger.warn({ err: e?.message }, 'Failed to persist migrated telegram_chat_id');
          }
          // Gửi lại ngay lập tức tới Chat ID mới
          return sendTelegramMessage(text, newChatId, 1);
        }

        logger.warn({ description: data.description, chatId }, 'Telegram API returned non-ok response');
        return { success: false, error: data.description || 'Lỗi gửi tin nhắn Telegram.' };
      }

      return { success: true };
    } catch (err: any) {
      if (attempt < retryCount) {
        logger.warn({ err: err.message, attempt }, 'Telegram send failed, retrying in 1.5s...');
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      logger.error({ err: err.message }, 'Failed to send Telegram message after retries');
      return { success: false, error: err.message || 'Lỗi kết nối tới Telegram API.' };
    }
  }

  return { success: false, error: 'Lỗi không xác định khi gửi Telegram.' };
}

/**
 * Bắn thông báo Đơn đặt lịch mới vào Group Telegram của KTV & Quản lý
 */
export async function notifyNewOrder(orderId: number): Promise<void> {
  try {
    const db = getDb();
    const order = db
      .prepare(`
        SELECT 
          o.id,
          o.code,
          o.scheduled_date,
          o.scheduled_start,
          o.scheduled_end,
          o.location,
          o.note,
          o.price,
          o.final_amount,
          p.name AS package_name,
          c.name AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          t.name AS requested_technician_name
        FROM orders o
        LEFT JOIN service_packages p ON p.id = o.package_id
        LEFT JOIN users c ON c.id = o.customer_id
        LEFT JOIN users t ON t.id = o.technician_id
        WHERE o.id = ?
      `)
      .get(orderId) as any;

    if (!order) {
      logger.warn({ orderId }, 'Cannot notify new order: Order not found');
      return;
    }

    const appUrl = config.publicBaseUrl.replace(/\/+$/, '');
    const orderUrl = `${appUrl}/technician/orders/${order.id}`;

    const formattedAmount = Number(order.final_amount || order.price || 0).toLocaleString('vi-VN');
    const customerPhoneDisplay = order.customer_phone ? escapeHtml(order.customer_phone) : 'Chưa có SĐT';
    const isSpecificTech = Boolean(order.requested_technician_name);

    const title = isSpecificTech
      ? `🚨 <b>[CÓ ĐƠN MỚI — CHỈ ĐỊNH ĐÍCH DANH KTV]</b>`
      : `🚨 <b>[CÓ ĐƠN ĐẶT LỊCH MỚI — ĐIỀU PHỐI TỰ DO]</b>`;

    const techDesignation = isSpecificTech
      ? `👨‍🔧 <b>Yêu cầu chỉ định:</b> <b>${escapeHtml(order.requested_technician_name)}</b> <i>(Khách hàng đích danh yêu cầu)</i>`
      : '🤖 <b>Phân công:</b> <i>Chưa chỉ định (Kỹ thuật viên nào rảnh có thể tiếp nhận ngay)</i>';

    const actionText = isSpecificTech
      ? `👉 <a href="${orderUrl}">Bấm vào đây để KTV ${escapeHtml(order.requested_technician_name)} tiếp nhận đơn</a>`
      : `👉 <a href="${orderUrl}">Bấm vào đây để mở và tiếp nhận đơn ngay</a>`;

    const message = [
      title,
      '━━━━━━━━━━━━━━━━━━━━',
      `🏷️ <b>Mã đơn:</b> <code>#${escapeHtml(order.code)}</code>`,
      `📦 <b>Gói dịch vụ:</b> <b>${escapeHtml(order.package_name || 'Dịch vụ bảo dưỡng')}</b> (${formattedAmount} đ)`,
      `👤 <b>Khách hàng:</b> ${escapeHtml(order.customer_name || 'Khách hàng')}`,
      `📞 <b>Liên hệ:</b> <code>${customerPhoneDisplay}</code>`,
      `⏰ <b>Thời gian hẹn:</b> ${escapeHtml(order.scheduled_start)} - ${escapeHtml(order.scheduled_end || '')} (Ngày ${escapeHtml(order.scheduled_date)})`,
      `📍 <b>Địa điểm:</b> ${escapeHtml(order.location || 'Phòng 1603, Tòa A1, ĐH Công nghiệp Hà Nội')}`,
      techDesignation,
      order.note ? `📝 <b>Ghi chú:</b> <i>${escapeHtml(order.note)}</i>` : '',
      '━━━━━━━━━━━━━━━━━━━━',
      actionText,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await sendTelegramMessage(message);
    if (!res.success) {
      logger.warn({ orderId, error: res.error }, 'Failed to deliver Telegram new order notification');
    } else {
      logger.info({ orderId, code: order.code, isSpecificTech }, 'Telegram new order notification delivered successfully');
    }
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, 'Error in notifyNewOrder');
  }
}

/**
 * Bắn thông báo khi KTV tiếp nhận đơn vào Group Telegram
 */
export async function notifyOrderClaimed(orderId: number, technicianName: string): Promise<void> {
  try {
    const db = getDb();
    const order = db
      .prepare('SELECT id, code, scheduled_date, scheduled_start FROM orders WHERE id = ?')
      .get(orderId) as any;

    if (!order) return;

    const appUrl = config.publicBaseUrl.replace(/\/+$/, '');
    const orderUrl = `${appUrl}/technician/orders/${order.id}`;

    const message = [
      '🛠️ <b>[KTV ĐÃ TIẾP NHẬN ĐƠN]</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      `🏷️ <b>Mã đơn:</b> <code>#${escapeHtml(order.code)}</code>`,
      `👨‍🔧 <b>Kỹ thuật viên:</b> <b>${escapeHtml(technicianName)}</b>`,
      `⏰ <b>Ca làm việc:</b> ${escapeHtml(order.scheduled_start)} (${escapeHtml(order.scheduled_date)})`,
      '━━━━━━━━━━━━━━━━━━━━',
      `👉 <a href="${orderUrl}">Xem tiến độ xử lý đơn</a>`,
    ].join('\n');

    await sendTelegramMessage(message);
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, 'Error in notifyOrderClaimed');
  }
}

/**
 * Bắn thông báo khi Quản lý / Admin phân công KTV cho đơn hàng vào Group Telegram
 */
export async function notifyOrderAssigned(
  orderId: number,
  technicianName: string,
  assignedByName?: string
): Promise<void> {
  try {
    const db = getDb();
    const order = db
      .prepare('SELECT id, code, scheduled_date, scheduled_start FROM orders WHERE id = ?')
      .get(orderId) as any;

    if (!order) return;

    const appUrl = config.publicBaseUrl.replace(/\/+$/, '');
    const orderUrl = `${appUrl}/technician/orders/${order.id}`;
    const assignerText = assignedByName ? escapeHtml(assignedByName) : 'Quản lý';

    const message = [
      '📋 <b>[ĐIỀU PHỐI / PHÂN CÔNG ĐƠN HÀNG]</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      `🏷️ <b>Mã đơn:</b> <code>#${escapeHtml(order.code)}</code>`,
      `👨‍💼 <b>Người điều phối:</b> <b>${assignerText}</b>`,
      `👨‍🔧 <b>KTV được chỉ định:</b> <b>${escapeHtml(technicianName)}</b>`,
      `⏰ <b>Ca làm việc:</b> ${escapeHtml(order.scheduled_start)} (${escapeHtml(order.scheduled_date)})`,
      '━━━━━━━━━━━━━━━━━━━━',
      `👉 <a href="${orderUrl}">Bấm vào đây để KTV xem và chuẩn bị đơn</a>`,
    ].join('\n');

    await sendTelegramMessage(message);
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, 'Error in notifyOrderAssigned');
  }
}

/**
 * Bắn thông báo khi đơn hàng bị hủy vào Group Telegram
 */
export async function notifyOrderCancelled(
  orderId: number,
  cancelledByName?: string,
  reason?: string
): Promise<void> {
  try {
    const db = getDb();
    const order = db
      .prepare(`
        SELECT o.id, o.code, o.scheduled_date, o.scheduled_start, c.name AS customer_name
        FROM orders o
        LEFT JOIN users c ON c.id = o.customer_id
        WHERE o.id = ?
      `)
      .get(orderId) as any;

    if (!order) return;

    const canceler = cancelledByName ? escapeHtml(cancelledByName) : 'Quản lý';
    const message = [
      '❌ <b>[ĐƠN HÀNG ĐÃ HỦY]</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      `🏷️ <b>Mã đơn:</b> <code>#${escapeHtml(order.code)}</code>`,
      `👤 <b>Khách hàng:</b> ${escapeHtml(order.customer_name || 'Khách hàng')}`,
      `⏰ <b>Thời gian hẹn:</b> ${escapeHtml(order.scheduled_start)} (${escapeHtml(order.scheduled_date)})`,
      `🚫 <b>Người cập nhật hủy:</b> <b>${canceler}</b>`,
      reason ? `📝 <b>Ghi chú:</b> <i>${escapeHtml(reason)}</i>` : '',
      '━━━━━━━━━━━━━━━━━━━━',
      'Đơn đã đóng lại và giải phóng lịch làm việc.',
    ]
      .filter(Boolean)
      .join('\n');

    await sendTelegramMessage(message);
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, 'Error in notifyOrderCancelled');
  }
}

/**
 * Bắn thử nghiệm tin nhắn mẫu để kiểm tra kết nối bot
 */
export async function testTelegramConnection(
  targetChatId?: string
): Promise<{ success: boolean; message: string }> {
  const settings = getSystemSettings();
  const testChatId = targetChatId?.trim() || settings.telegramChatId?.trim();

  if (!testChatId) {
    return {
      success: false,
      message: 'Vui lòng nhập hoặc phát hiện Chat ID trước khi gửi tin nhắn thử nghiệm.',
    };
  }

  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const text = [
    '🔔 <b>[IT SUPPORTER HaUI — TEST PING]</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    '✅ Kết nối hệ thống cảnh báo Telegram hoạt động hoàn hảo!',
    '🤖 <b>Bot:</b> @canh_technician_bot',
    `🆔 <b>Chat ID:</b> <code>${escapeHtml(testChatId)}</code>`,
    `⏰ <b>Thời gian test:</b> ${now}`,
    '━━━━━━━━━━━━━━━━━━━━',
    'Tất cả đơn đặt lịch mới sẽ được tự động báo tức thì vào nhóm này.',
  ].join('\n');

  const result = await sendTelegramMessage(text, testChatId);
  if (!result.success) {
    return {
      success: false,
      message: `Thử nghiệm thất bại: ${result.error}`,
    };
  }

  return {
    success: true,
    message: 'Đã gửi tin nhắn thử nghiệm thành công vào nhóm Telegram!',
  };
}

/**
 * Tự động phát hiện Chat ID từ tin nhắn mới nhất gửi đến bot
 */
export async function detectTelegramChatId(): Promise<{
  success: boolean;
  message: string;
  data?: {
    chatId: string;
    chatTitle: string;
    chatType: string;
  };
}> {
  try {
    const settings = getSystemSettings();
    const botToken = settings.telegramBotToken?.trim();
    const apiUrl = getSafeTelegramApiUrl(settings.telegramApiUrl?.trim());

    if (!botToken) {
      return {
        success: false,
        message: 'Chưa cấu hình Telegram Bot Token trong hệ thống.',
      };
    }

    const endpoint = `${apiUrl.replace(/\/+$/, '')}/bot${botToken}/getUpdates?offset=-10&limit=10`;
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(6000),
      dispatcher: telegramAgent,
    } as any);

    const body = (await response.json()) as {
      ok: boolean;
      description?: string;
      result?: Array<{
        message?: {
          chat?: { id: number | string; title?: string; username?: string; first_name?: string; type: string };
        };
        my_chat_member?: {
          chat?: { id: number | string; title?: string; username?: string; type: string };
        };
        channel_post?: {
          chat?: { id: number | string; title?: string; type: string };
        };
      }>;
    };

    if (!body.ok) {
      return {
        success: false,
        message: `Telegram API lỗi: ${body.description || 'Không thể lấy dữ liệu updates'}`,
      };
    }

    const updates = body.result || [];
    if (updates.length === 0) {
      return {
        success: false,
        message:
          'Chưa tìm thấy tin nhắn nào gửi tới bot. Bạn hãy: 1) Add @canh_technician_bot vào nhóm, 2) Nhắn 1 tin bất kỳ (ví dụ: "xin chào") vào nhóm, rồi bấm lại nút này nhé!',
      };
    }

    // Ưu tiên tìm tin nhắn từ Group / Supergroup, nếu không thì lấy chat mới nhất
    let targetChat: { id: number | string; title?: string; username?: string; first_name?: string; type: string } | null = null;

    for (let i = updates.length - 1; i >= 0; i--) {
      const u = updates[i];
      const chat = u.message?.chat || u.my_chat_member?.chat || u.channel_post?.chat;
      if (chat) {
        if (['group', 'supergroup', 'channel'].includes(chat.type)) {
          targetChat = chat;
          break;
        }
        if (!targetChat) {
          targetChat = chat;
        }
      }
    }

    if (!targetChat) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin phòng chat hợp lệ trong các tin nhắn gần nhất.',
      };
    }

    const detectedId = String(targetChat.id);
    const detectedTitle =
      targetChat.title ||
      targetChat.username ||
      targetChat.first_name ||
      `Chat ${detectedId}`;

    // Tự động lưu vào system_settings
    setSetting('telegram_chat_id', detectedId);

    return {
      success: true,
      message: `Đã phát hiện và tự động lưu Chat ID cho: "${detectedTitle}" (${targetChat.type})`,
      data: {
        chatId: detectedId,
        chatTitle: detectedTitle,
        chatType: targetChat.type,
      },
    };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to detect Telegram chat ID');
    return {
      success: false,
      message: `Lỗi kết nối khi quét Telegram: ${err.message}`,
    };
  }
}
