import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/me') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const token = response.data.data?.accessToken;
        if (token) {
          processQueue(null, token);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }
        throw new Error('No token in refresh response');
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string, rememberMe?: boolean) =>
    api.post('/auth/login', { email, password, rememberMe }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  updateProfile: (data: {
    name?: string;
    phone?: string | null;
    contactInfo?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    publicProfile?: string | null;
  }) => api.patch('/auth/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const orderApi = {
  create: (data: {
    packageId: number;
    scheduledDate: string;
    scheduledStart: string;
    requestedTechnicianId?: number | null;
    location: string;
    note?: string | null;
  }) => api.post('/orders', data),
  listMy: (params?: { limit?: number; offset?: number }) =>
    api.get('/orders', { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  confirm: (id: number) => api.post(`/orders/${id}/confirm`),
  start: (id: number) => api.post(`/orders/${id}/start`),
  complete: (id: number, data: {
    completion_result: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    payment_status?: 'PAID' | 'UNPAID';
    unpaid_reason?: string | null;
    note?: string | null;
  }) => api.post(`/orders/${id}/complete`, data),
  timeline: (id: number) => api.get(`/orders/${id}/timeline`),
  getMessages: (id: number) => api.get(`/orders/${id}/messages`),
  sendMessage: (id: number, message: string) => api.post(`/orders/${id}/messages`, { message }),
  markRead: (id: number) => api.patch(`/orders/${id}/messages/read`),
  getUnreadCount: (id: number) => api.get(`/orders/${id}/messages/unread`),
};

export const chatApi = {
  list: (orderId: number) => api.get(`/orders/${orderId}/messages`),
  send: (orderId: number, message: string) => api.post(`/orders/${orderId}/messages`, { message }),
  sendVoucher: (orderId: number, voucherId: number, note?: string) =>
    api.post(`/orders/${orderId}/messages/voucher`, { voucherId, note }),
  markRead: (orderId: number) => api.patch(`/orders/${orderId}/messages/read`),
  unreadCount: (orderId: number) => api.get(`/orders/${orderId}/messages/unread`),
};

export const notificationApi = {
  list: (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) =>
    api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
};

export const reviewApi = {
  create: (data: { orderId: number; rating: number; content: string }) =>
    api.post('/reviews', data),
  listMy: () => api.get('/reviews'),
  getByTechnician: (technicianId: number) => api.get(`/reviews/technician/${technicianId}`),
  getByOrder: (orderId: number) => api.get(`/orders/${orderId}/review`),
};

export const technicianApi = {
  schedule: (date: string) => api.get('/technician/schedule', { params: { date } }),
  finance: () => api.get('/technician/finance'),
  getShifts: () => api.get('/technician/shifts'),
  updateShifts: (shifts: Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean | number }>) =>
    api.put('/technician/shifts', { shifts }),
  orders: (params?: { status?: string }) => api.get('/technician/orders', { params }),
  orderDetail: (id: number) => api.get(`/technician/orders/${id}`),
  confirm: (id: number) => api.post(`/technician/orders/${id}/confirm`),
  start: (id: number) => api.post(`/technician/orders/${id}/start`),
  penalty: (id: number, data: { penalty_percent?: number; late_minutes?: number; reason?: string }) =>
    api.post(`/technician/orders/${id}/penalty`, data),
  extend: (id: number, data: { extend_fee: number; reason?: string }) =>
    api.post(`/technician/orders/${id}/extend`, data),
  saleProgram: (id: number, programId: number) =>
    api.post(`/technician/orders/${id}/sale-program`, { programId }),
  redeemVoucher: (id: number, code: string) =>
    api.post(`/technician/orders/${id}/redeem-voucher`, { code }),
  payment: (id: number, data: { payment_status: 'PAID' | 'UNPAID'; unpaid_reason?: string | null; payment_qr_path?: string | null }) =>
    api.post(`/technician/orders/${id}/payment`, data),
  complete: (id: number, data: {
    completion_result: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    payment_status?: 'PAID' | 'UNPAID';
    unpaid_reason?: string | null;
    note?: string | null;
  }) => api.post(`/technician/orders/${id}/complete`, data),
  timeline: (id: number) => api.get(`/technician/orders/${id}/timeline`),
};

export const managerApi = {
  orders: (params?: { status?: string; technician_id?: number; from?: string; to?: string }) =>
    api.get('/manager/orders', { params }),
  analytics: (params?: { days?: number }) =>
    api.get('/manager/analytics', { params }),
  orderAvailableTechnicians: (orderId: number) =>
    api.get(`/manager/orders/${orderId}/available-technicians`),
  assignTechnician: (orderId: number, technicianId: number) =>
    api.post(`/manager/orders/${orderId}/assign`, { technician_id: technicianId }),
  updateOrderStatus: (orderId: number, status: string) =>
    api.patch(`/manager/orders/${orderId}/status`, { status }),
  technicians: () => api.get('/manager/technicians'),
  packages: () => api.get('/manager/packages'),
  createPackage: (data: {
    name: string;
    description?: string;
    price: number;
    duration_minutes?: number;
    features?: string;
    is_active?: boolean | number;
  }) => api.post('/manager/packages', data),
  updatePackage: (id: number, data: Partial<{
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    features: string;
    is_active: boolean | number;
  }>) => api.patch(`/manager/packages/${id}`, data),
  deletePackage: (id: number) => api.delete(`/manager/packages/${id}`),
  settlements: (params?: { limit?: number; offset?: number }) => api.get('/manager/settlements', { params }),
  createSettlement: (technicianId: number, notes?: string) =>
    api.post('/manager/settlements', { technician_id: technicianId, notes }),
  reviews: () => api.get('/manager/reviews'),
  deleteReview: (id: number) => api.delete(`/manager/reviews/${id}`),
  settings: () => api.get('/manager/settings'),
  updateSettings: (data: any) => api.put('/manager/settings', data),
  exportReport: (params: { type: 'orders' | 'settlements' | 'financial'; format: 'xlsx' | 'csv'; from?: string; to?: string; status?: string; technician_id?: number }) =>
    api.get('/manager/export', { params, responseType: 'blob' }),
  finance: {
    listSettlements: (params?: { limit?: number; offset?: number }) => api.get('/finance/settlements', { params }),
    getRevenueSummary: (from: string, to: string) => api.get('/finance/revenue-summary', { params: { from, to } }),
  },
};

export const voucherApi = {
  validate: (code: string, orderId?: number) => api.post('/vouchers/validate', { code, orderId }),
  redeem: (code: string, orderId: number) => api.post('/vouchers/redeem', { code, orderId }),
  myVouchers: () => api.get('/vouchers/my'),
  technicianVouchers: () => api.get('/vouchers/technician'),
  programs: () => api.get('/vouchers/programs'),
  createProgram: (data: {
    code: string;
    name: string;
    description?: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    max_usage?: number;
    valid_from?: string;
    valid_to?: string;
  }) => api.post('/vouchers/programs', data),
  updateProgram: (id: number, data: Partial<{ name: string; description: string; is_active: number; valid_to: string }>) =>
    api.patch(`/vouchers/programs/${id}`, data),
  deleteProgram: (id: number) => api.delete(`/vouchers/programs/${id}`),
  generateCodes: (programId: number, count: number, customerId?: number) =>
    api.post(`/vouchers/programs/${programId}/generate`, { count, customerId }),
  programVouchers: (programId: number) => api.get(`/vouchers/programs/${programId}/vouchers`),
  voidVoucher: (id: number) => api.post(`/vouchers/${id}/void`),
};

export const adminApi = {
  users: (params?: { role?: string; status?: string; q?: string }) => api.get('/admin/users', { params }),
  updateUserStatus: (id: number, status: 'ACTIVE' | 'DISABLED') =>
    api.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id: number, role: 'GUEST' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN') =>
    api.patch(`/admin/users/${id}/role`, { role }),
  resetPassword: (id: number, newPassword?: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  stats: () => api.get('/admin/stats'),
  settings: () => api.get('/admin/settings'),
  updateSettings: (data: Record<string, string | number>) => api.patch('/admin/settings', data),
  qr: {
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('qr', file);
      return api.post('/admin/qr', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    get: () => api.get('/admin/qr'),
    getActive: () => api.get('/admin/qr/active'),
    delete: (id: number) => api.delete(`/admin/qr/${id}`),
  },
};

export const publicApi = {
  info: () => api.get('/public/info'),
  packages: () => api.get('/public/packages'),
  slots: (date: string) => api.get('/public/slots', { params: { date } }),
  technicians: (date: string, start?: string) =>
    api.get('/public/technicians', { params: { date, ...(start ? { start } : {}) } }),
  orders: (params?: { limit?: number; offset?: number }) => api.get('/public/orders', { params }),
  reviews: (params?: { limit?: number; offset?: number }) => api.get('/public/reviews', { params }),
  health: () => api.get('/health'),
  activeQr: () => api.get('/admin/qr/active'),
};

export default api;