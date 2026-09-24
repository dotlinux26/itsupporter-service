export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'GUEST' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  avatar_url: string | null;
  contact_info: string | null;
  bio?: string | null;
  public_profile?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServicePackage {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  duration_minutes: number;
  features: string;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED';
export type CompletionResult = 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID';

export interface Order {
  id: number;
  code: string;
  customer_id: number;
  technician_id: number | null;
  package_id: number;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  note: string | null;
  price: number;
  penalty: number;
  discount: number;
  extend_fee: number;
  final_amount: number;
  status: OrderStatus;
  completion_result: CompletionResult | null;
  payment_status: PaymentStatus;
  unpaid_reason: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRow extends Order {
  customer_name?: string;
  customer_phone?: string | null;
  customer_email?: string;
  customer_contact_info?: string | null;
  package_name?: string;
  technician_name?: string | null;
  technician_email?: string | null;
  technician_avatar?: string | null;
  actor_name?: string | null;
  has_unread?: number;
  last_message_at?: string | null;
}

export interface OrderMessage {
  id: number;
  order_id: number;
  sender_id: number;
  message: string;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
}

export interface NotificationRecord {
  id: number;
  user_id: number;
  order_id: number | null;
  type: string;
  title: string;
  content: string | null;
  is_read: number;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  order_id: number;
  customer_id: number;
  technician_id: number | null;
  rating: number;
  content: string;
  created_at: string;
  order_code?: string;
  package_name?: string;
  technician_name?: string | null;
  customer_name?: string;
}

export interface FinancialTransaction {
  id: number;
  transaction_code: string;
  order_id: number | null;
  technician_id: number | null;
  type: string;
  amount: number;
  direction: 'IN' | 'OUT';
  created_at: string;
  created_by: number | null;
  reference: string | null;
}

export interface SystemSettings {
  latePenaltyMinutes: number;
  latePenaltyPercent: number;
  freeServiceAfterMinutes: number;
  workingStart: string;
  workingEnd: string;
  slotDurationMinutes: number;
  timezone: string;
  technicianSharePercent: number;
  teamSharePercent: number;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DaySlots {
  date: string;
  dayName: string;
  dayNumber: number;
  slots: Array<{
    start: string;
    end: string;
    available: boolean;
    technicians: Array<{
      id: number;
      name: string;
      avatar_url: string | null;
    }>;
  }>;
}

export interface TechnicianBrief {
  id: number;
  name: string;
  avatar_url: string | null;
  rating?: number;
  rating_count?: number;
  email?: string;
  phone?: string;
  bio?: string | null;
  public_profile?: string | null;
}

export interface Settlement {
  id: number;
  code: string;
  technician_id: number;
  manager_id: number;
  amount: number;
  notes: string | null;
  created_at: string;
  technician_name: string;
  manager_name: string;
}

export interface RevenueSummary {
  from: string;
  to: string;
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}