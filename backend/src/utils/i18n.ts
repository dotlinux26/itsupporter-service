export type Locale = 'vi' | 'en';
export type TranslationKey =
  | 'error.UNAUTHORIZED'
  | 'error.FORBIDDEN'
  | 'error.NOT_FOUND'
  | 'error.VALIDATION_ERROR'
  | 'error.RATE_LIMITED'
  | 'error.SLOT_NOT_AVAILABLE'
  | 'error.ORDER_ALREADY_BOOKED'
  | 'error.INVALID_STATUS_TRANSITION'
  | 'error.INVALID_CREDENTIALS'
  | 'error.ACCOUNT_DISABLED'
  | 'error.PASSWORD_WRONG'
  | 'error.EMAIL_EXISTS'
  | 'error.INTERNAL_ERROR'
  | 'order.created'
  | 'order.confirmed'
  | 'order.started'
  | 'order.completed'
  | 'order.cancelled'
  | 'chat.new_message';

const messages: Record<Locale, Record<TranslationKey, string>> = {
  vi: {
    'error.UNAUTHORIZED': 'Vui lòng đăng nhập để tiếp tục.',
    'error.FORBIDDEN': 'Bạn không có quyền thực hiện hành động này.',
    'error.NOT_FOUND': 'Không tìm thấy tài nguyên.',
    'error.VALIDATION_ERROR': 'Dữ liệu gửi lên không hợp lệ.',
    'error.RATE_LIMITED': 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    'error.SLOT_NOT_AVAILABLE': 'Khung giờ này không còn khả dụng hoặc vừa được người khác đặt.',
    'error.ORDER_ALREADY_BOOKED': 'Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.',
    'error.INVALID_STATUS_TRANSITION': 'Không thể chuyển trạng thái đơn theo cách này.',
    'error.INVALID_CREDENTIALS': 'Email hoặc mật khẩu không đúng.',
    'error.ACCOUNT_DISABLED': 'Tài khoản của bạn đã bị vô hiệu hóa.',
    'error.PASSWORD_WRONG': 'Mật khẩu không đúng.',
    'error.EMAIL_EXISTS': 'Email này đã được sử dụng.',
    'error.INTERNAL_ERROR': 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
    'order.created': 'Đơn hàng mới được tạo',
    'order.confirmed': 'Đơn hàng đã được xác nhận',
    'order.started': 'Dịch vụ đang được thực hiện',
    'order.completed': 'Đơn hàng đã hoàn thành',
    'order.cancelled': 'Đơn hàng đã bị hủy',
    'chat.new_message': 'Tin nhắn mới',
  },
  en: {
    'error.UNAUTHORIZED': 'Please sign in to continue.',
    'error.FORBIDDEN': 'You do not have permission to perform this action.',
    'error.NOT_FOUND': 'Resource not found.',
    'error.VALIDATION_ERROR': 'Submitted data is invalid.',
    'error.RATE_LIMITED': 'Too many requests. Please try again later.',
    'error.SLOT_NOT_AVAILABLE': 'This time slot is no longer available or was just booked by someone else.',
    'error.ORDER_ALREADY_BOOKED': 'This time slot has already been booked. Please choose another slot.',
    'error.INVALID_STATUS_TRANSITION': 'Cannot change order status this way.',
    'error.INVALID_CREDENTIALS': 'Incorrect email or password.',
    'error.ACCOUNT_DISABLED': 'Your account has been disabled.',
    'error.PASSWORD_WRONG': 'Incorrect password.',
    'error.EMAIL_EXISTS': 'This email is already in use.',
    'error.INTERNAL_ERROR': 'A system error occurred. Please try again later.',
    'order.created': 'New order created',
    'order.confirmed': 'Order confirmed',
    'order.started': 'Service in progress',
    'order.completed': 'Order completed',
    'order.cancelled': 'Order cancelled',
    'chat.new_message': 'New message',
  },
};

export const SUPPORTED_LOCALES: Locale[] = ['vi', 'en'];
export const DEFAULT_LOCALE: Locale = 'vi';

export function isLocale(value: unknown): value is Locale {
  return value === 'vi' || value === 'en';
}

export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('vi')) return 'vi';
  if (normalized.startsWith('en')) return 'en';
  const exact = value.trim() as Locale;
  return isLocale(exact) ? exact : DEFAULT_LOCALE;
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  let text = messages[locale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}