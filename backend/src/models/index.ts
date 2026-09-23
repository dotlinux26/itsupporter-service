export type Role = 'GUEST' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  contact_info: string | null;
  status: UserStatus;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export interface TechnicianProfile {
  id: number;
  user_id: number;
  bio: string | null;
  public_profile: string | null;
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

export interface OrderStatusHistoryRecord {
  id: number;
  order_id: number;
  from_status: string | null;
  to_status: string;
  actor_id: number | null;
  note: string | null;
  created_at: string;
}

export interface OrderMessage {
  id: number;
  order_id: number;
  sender_id: number;
  message: string;
  read_at: string | null;
  created_at: string;
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
}

export type FinancialTransactionType =
  | 'ORDER_REVENUE'
  | 'TECHNICIAN_SHARE'
  | 'TEAM_SHARE'
  | 'LATE_PENALTY'
  | 'EXTEND_FEE'
  | 'SETTLEMENT'
  | 'REFUND'
  | 'ADJUSTMENT';

export interface FinancialTransaction {
  id: number;
  transaction_code: string;
  order_id: number | null;
  technician_id: number | null;
  type: FinancialTransactionType;
  amount: number;
  direction: 'IN' | 'OUT';
  reference_id: string | null;
  metadata: string | null;
  created_by: number | null;
  created_at: string;
}

export interface Settlement {
  id: number;
  settlement_code: string;
  technician_id: number;
  manager_id: number;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface QrConfig {
  id: number;
  path: string;
  uploaded_by: number | null;
  description: string | null;
  is_active: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id: number | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip: string | null;
  result: string;
  metadata: string | null;
  created_at: string;
}

export interface RescheduleRequest {
  id: number;
  order_id: number;
  requested_by: number;
  requested_date: string;
  requested_start: string;
  requested_end: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  responded_at: string | null;
  responded_by: number | null;
  note: string | null;
  created_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: 'QR' | 'CASH';
  status: PaymentStatus;
  reason: string | null;
  qr_config_id: number | null;
  recorded_by: number;
  created_at: string;
}