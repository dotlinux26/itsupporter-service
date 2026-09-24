import type { Order, OrderMessage, OrderRow, Review, ServicePackage, User } from '../models/index.js';

export interface PublicUserDTO {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
}

export function toPublicUserDTO(user: User): PublicUserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar_url: user.avatar_url,
  };
}

export interface PublicTechnicianDTO {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  public_profile: string | null;
  rating_avg: number | null;
  review_count: number;
  contact_info: string | null;
}

export function toPublicTechnicianDTO(
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar_url' | 'contact_info'> & {
    bio: string | null;
    public_profile: string | null;
    rating_avg: number | null;
    review_count: number;
  }
): PublicTechnicianDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    bio: user.bio,
    public_profile: user.public_profile,
    rating_avg: user.rating_avg,
    review_count: user.review_count,
    contact_info: user.contact_info,
  };
}

export interface PublicPackageDTO {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  duration_minutes: number;
  features: string[];
  display_order: number;
}

export function toPublicPackageDTO(pkg: ServicePackage): PublicPackageDTO {
  let features: string[] = [];
  try {
    features = JSON.parse(pkg.features ?? '[]');
  } catch {
    features = [];
  }
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    price: pkg.price,
    image: pkg.image,
    duration_minutes: pkg.duration_minutes,
    features,
    display_order: pkg.display_order,
  };
}

export type OrderStatusKey = Order['status'];
export type PaymentStatusKey = Order['payment_status'];

export interface PublicOrderDTO {
  id: number;
  code: string;
  customer_id: number;
  customer_name: string;
  package_name: string;
  package_price: number;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  status: OrderStatusKey;
  completion_result: string | null;
  payment_status: PaymentStatusKey;
  final_amount: number;
  technician: { id: number; name: string; avatar_url: string | null } | null;
  has_unread: 0 | 1;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toPublicOrderDTO(order: OrderRow): PublicOrderDTO {
  return {
    id: order.id,
    code: order.code,
    customer_id: order.customer_id,
    customer_name: order.customer_name ?? '',
    package_name: order.package_name ?? '',
    package_price: order.price,
    scheduled_date: order.scheduled_date,
    scheduled_start: order.scheduled_start,
    scheduled_end: order.scheduled_end,
    location: order.location,
    status: order.status,
    completion_result: order.completion_result,
    payment_status: order.payment_status,
    final_amount: order.final_amount,
    technician:
      order.technician_id != null
        ? { id: order.technician_id, name: order.technician_name ?? '', avatar_url: order.technician_avatar ?? null }
        : null,
    has_unread: (order.has_unread ?? 0) as 0 | 1,
    last_message_at: order.last_message_at ?? null,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export interface OrderDetailDTO extends PublicOrderDTO {
  note: string | null;
  penalty: number;
  discount: number;
  extend_fee: number;
  price: number;
  started_at: string | null;
  completed_at: string | null;
  unpaid_reason: string | null;
  customer_phone: string | null;
  customer_email: string;
  customer_contact_info: string | null;
  timeline: Array<{
    from_status: string | null;
    to_status: string;
    actor_id: number | null;
    actor_name?: string;
    note: string | null;
    created_at: string;
  }>;
}

export interface ChatMessageDTO {
  id: number;
  order_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
}

export function toChatMessageDTO(msg: OrderMessage & { sender_name: string; sender_avatar: string | null }): ChatMessageDTO {
  return {
    id: msg.id,
    order_id: msg.order_id,
    sender_id: msg.sender_id,
    sender_name: msg.sender_name,
    sender_avatar: msg.sender_avatar,
    message: msg.message,
    read_at: msg.read_at,
    created_at: msg.created_at,
  };
}

export interface PublicReviewDTO {
  id: number;
  order_code: string;
  customer_name: string;
  technician_name: string | null;
  rating: number;
  content: string;
  created_at: string;
}

export function toPublicReviewDTO(r: Review & { customer_name: string; technician_name?: string | null; order_code?: string }): PublicReviewDTO {
  return {
    id: r.id,
    order_code: r.order_code ?? '',
    customer_name: r.customer_name,
    technician_name: r.technician_name ?? null,
    rating: r.rating,
    content: r.content,
    created_at: r.created_at,
  };
}