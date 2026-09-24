BÁO CÁO TRIỂN KHAI BACKEND & FRONTEND - IT SUPPORTER SERVICE
📋 TỔNG QUAN DỰ ÁN
Hệ thống đặt lịch dịch vụ IT Supporter với 4 vai trò: GUEST/CUSTOMER, TECHNICIAN, MANAGER, ADMIN. Backend Express + TypeScript + SQLite, Frontend Vite + React + TypeScript + TailwindCSS.
✅ TRẠNG THÁI HIỆN TẠI (ĐÃ HOÀN THÀNH)
Module
Backend Core (DB, Auth, RBAC, Ledger)
Order Flow (Create/List/Detail)
Technician Transitions (Confirm/Start/Complete + Ledger)
Chat theo đơn (List/Send/Read/Unread)
Notification + Review
Technician/Manager/Admin Routes + RBAC
Frontend Scaffold + Public/Customer Pages
Calendar Widget (7-day, slots, tech avatars)
Typecheck & CJK Clean
🎯 KẾ HOẠCH TRIỂN KHAI TIẾP THEO (BACKEND)
1. HỆ THỐNG VOUCHER (Ưu tiên CAO)
Database Schema (Cần migration)
-- Voucher Programs (Chương trình voucher do Admin tạo)
CREATE TABLE voucher_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,           -- Mã chương trình: "WELCOME10", "SALE20"
  name TEXT NOT NULL,                  -- "Chào mừng khách mới 10%"
  description TEXT,
  discount_type TEXT NOT NULL,         -- 'percent' | 'fixed'
  discount_value INTEGER NOT NULL,     -- 10, 20, 50, 100 (%)
  max_usage INTEGER DEFAULT 1,         -- Số lần dùng cho 1 user
  valid_from DATETIME,
  valid_to DATETIME,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Voucher Codes (Mã voucher cụ thể phát cho khách)
CREATE TABLE vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER REFERENCES voucher_programs(id),
  code TEXT UNIQUE NOT NULL,           -- Mã duy nhất: "WELCOME10-ABC123"
  customer_id INTEGER REFERENCES users(id), -- Khách nhận voucher
  technician_id INTEGER REFERENCES users(id), -- Tech gán voucher (tùy chọn)
  order_id INTEGER REFERENCES orders(id),   -- Đơn áp dụng (sau khi dùng)
  status TEXT DEFAULT 'active',        -- 'active' | 'used' | 'expired' | 'voided'
  assigned_at DATETIME,
  used_at DATETIME,
  expired_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Voucher Transactions (Lịch sử sử dụng)
CREATE TABLE voucher_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id INTEGER REFERENCES vouchers(id),
  order_id INTEGER REFERENCES orders(id),
  discount_amount INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
API Endpoints Cần Implement
POST   /api/voucher-programs          (Admin) Tạo chương trình voucher
GET    /api/voucher-programs          (Admin) Danh sách chương trình
PATCH  /api/voucher-programs/:id      (Admin) Cập nhật/chuyển trạng thái
DELETE /api/voucher-programs/:id      (Admin) Xóa

POST   /api/vouchers/generate         (Admin/Manager) Tạo batch voucher codes
GET    /api/vouchers                  (Admin/Manager) Danh sách voucher
GET    /api/vouchers/:code/validate   (Public/Tech) Validate voucher code
POST   /api/vouchers/:code/redeem     (Tech) Khách đọc mã -> Tech nhập -> Áp dụng
POST   /api/vouchers/:code/void       (Admin/Tech) Hủy voucher

GET    /api/my-vouchers               (Customer) Voucher của tôi
GET    /api/technician/vouchers       (Technician) Voucher được gán/quản lý
Business Logic
- Validate: Check active, not expired, not used, customer match, order eligible
- Redeem: Tạo transaction, cập nhật order final_amount, mark voucher used
- Stack: Voucher + Sale program = áp dụng cả 2 (voucher áp dụng sau sale)
- Void: Hoàn tác nếu order hủy/tech hủy
- Expired: Tự động hết hạn theo valid_to của program
2. HỆ THỐNG AVATAR (Tự động từ tên/email)
// utils/avatar.ts
export function generateAvatar(name: string, email?: string): string {
  const initials = name
    .split(' ')
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
  
  // Tạo màu nền dựa trên hash tên (giống Google)
  const colors = [
    '#FF6B35', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6',
    '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899'
  ];
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bgColor = colors[hash % colors.length];
  
  return `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="${bgColor}"/>
      <text x="20" y="26" text-anchor="middle" fill="white" 
            font-family="Inter, sans-serif" font-size="14" font-weight="600">
        ${initials}
      </text>
    </svg>
  `;
}
Sử dụng: Backend trả avatar_url hoặc avatar_svg trong user object. Frontend render <img src={user.avatar_svg} /> hoặc fallback <img src={user.avatar_url} />.
3. MARKDOWN SUPPORT cho thông tin chi tiết
// Backend: Lưu raw markdown, trả về cả raw + html
// Frontend: Dùng react-markdown + remark-gfm

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {order.note || order.description}
</ReactMarkdown>
Ứng dụng: Order note, Service description, Review content, Terms/About page content.
4. PHẠT KHÁCH HÀNG (> 30p MUỘN = FREE)
Trạng thái Order Mới
type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

type PenaltyStatus = 
  | 'NONE' 
  | 'LATE_15%'      // Muộn 10-29 phút
  | 'FREE_SERVICE'; // Muộn >= 30 phút
Logic Backend
// Khi tech click "Bắt đầu" (IN_PROGRESS)
const lateMinutes = calculateLateMinutes(order.scheduled_start, actualStart);

let penaltyStatus: PenaltyStatus = 'NONE';
let penaltyPercent = 0;

if (lateMinutes >= 30) {
  penaltyStatus = 'FREE_SERVICE';
  penaltyPercent = 100;
} else if (lateMinutes >= 10) {
  penaltyStatus = 'LATE_15%';
  penaltyPercent = 15;
}

// Cập nhật order
await updateOrder(orderId, {
  penalty_status: penaltyStatus,
  penalty_percent: penaltyPercent,
  started_at: now
});
Frontend: Nút "Vi phạm - Làm free cho khách"
{order.status === 'IN_PROGRESS' && order.penalty_status !== 'FREE_SERVICE' && (
  <button 
    onClick={() => handlePenalty('FREE_SERVICE')}
    className="btn btn-danger"
  >
    ⚠️ Vi phạm - Làm FREE cho khách (0đ)
  </button>
)}
Khi kết toán: Nếu penalty_status = 'FREE_SERVICE' → final_amount = 0, technician_share = 0, team_share = 0, ledger ghi type: 'LATE_PENALTY', amount: -final_amount.
5. VOUCHER SYSTEM CHI TIẾT (Xem phần 1)
Voucher Design (Frontend - Styled Components)
// components/VoucherCard.tsx - Tham khảo mẫu ticket đẹp
// Sử dụng styled-components với holographic effects, QR/barcode
// Single-use: Mã dùng 1 lần -> gạch/chấm -> void
// QR code chứa: voucher_code, program_id, expiry
// Barcode: Code 128 format
// Holographic: CSS filter + conic-gradient animation
6. TECHNICIAN FEATURES AT JOB SITE
API Endpoints
POST   /api/technician/orders/:id/confirm     (Tech nhận đơn PENDING -> CONFIRMED)
POST   /api/technician/orders/:id/start       (Tech bắt đầu CONFIRMED -> IN_PROGRESS, timer start)
POST   /api/technician/orders/:id/complete    (Tech hoàn thành IN_PROGRESS -> COMPLETED)
POST   /api/technician/orders/:id/cancel      (Tech hủy đơn - cần lý do)
POST   /api/technician/orders/:id/penalty     (Tech chọn penalty: NONE | LATE_15% | FREE_SERVICE)
POST   /api/technician/orders/:id/extend      (Tech thêm dịch vụ/extend time)
POST   /api/technician/orders/:id/qr          (Lấy QR payment cho khách scan)
POST   /api/technician/orders/:id/payment     (Tech xác nhận thu/chưa thu + lý do)
Timer Real-time (Frontend)
// Timer bắt đầu khi status = IN_PROGRESS
// Dựa trên started_at từ backend (timestamp server)
// Frontend: count-up từ started_at
// Cảnh báo: >= 50 phút (còn 10p) -> warning color
7. QR PAYMENT SYSTEM
Admin upload QR -> Lưu base64/url -> Tech hiển thị QR khi hoàn thành
Customer scan -> Chuyển khoản -> Tech click "Đã thu" / "Chưa thu + lý do"
-> Backend cập nhật payment_status, unpaid_reason (nếu chưa thu)
-> Trigger ledger: ORDER_REVENUE, TECHNICIAN_SHARE, TEAM_SHARE
8. FINANCIAL LEDGER (Đã có - Cần mở rộng)
// Types đã có: ORDER_REVENUE, TECHNICIAN_SHARE, TEAM_SHARE, LATE_PENALTY, EXTEND_FEE, SETTLEMENT, REFUND, ADJUSTMENT
// Cần thêm: VOUCHER_DISCOUNT (khi áp dụng voucher)
// Settlement: Manager chọn tech -> Xem balance/ledger/orders -> Bấm "Kết toán" -> Double confirm -> Tạo settlement record
9. EXPORT XLSX/CSV (Manager/Admin)
// Backend: GET /api/manager/export?type=orders|settlements|revenue&from=&to=
// Response: Stream Excel (xlsx) hoặc CSV
// Columns: Order ID, Customer, Tech, Package, Date, Status, Amount, Penalty, Payment, Tech Share, Team Share
10. MARKDOWN & AVATAR (Frontend Integration)
// components/Avatar.tsx
export function Avatar({ name, email, size = 40 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  const colors = ['#FF6B35', '#10B981', '#3B82F6', ...];
  const bgColor = colors[name.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % 10];
  return (
    <div style={{width, height, borderRadius: '50%', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600}}>
      {initials}
    </div>
  );
}

// components/MarkdownContent.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export function MarkdownContent({ content }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
}
📅 LỊCH TRIỂN KHAI (Ưu tiên)
Tuần	Module
1-2	Voucher System
3	Avatar + Markdown
4	Late Penalty + Free Service
5-6	Voucher Redemption + Design
7	Tech Job Site Features
8	Settlement + Ledger + Export
9	Avatar + Markdown + Chat Voucher
9-10	Testing & Polish
🔧 TECH STACK CẦN THÊM
{
  "dependencies": {
    "styled-components": "^6.1.0",
    "qrcode.react": "^3.1.0",
    "barcode-js": "^1.0.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "xlsx": "^0.18.5",
    "csv-stringify": "^6.4.0",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/styled-components": "^5.1.34"
  }
}
📝 CẬP NHẬT WHITEBOOK (Cần bổ sung)
Cần thêm vào whitebook.md các section:
- # VOUCHER SYSTEM SPECIFICATION
- # AVATAR GENERATION SPECIFICATION
- # MARKDOWN SUPPORT SPECIFICATION
- # LATE PENALTY & FREE SERVICE POLICY
- # VOUCHER DESIGN SPECIFICATION
- # TECHNICIAN JOB SITE FEATURES
- # QR PAYMENT FLOW
- # EXPORT REPORTS SPECIFICATION
✅ CHECKLIST TRIỂN KHAI
- Voucher DB Migration
- Voucher Program CRUD (Admin)
- Voucher Generation (Batch)
- Voucher Validate/Redeem/Void API
- Voucher Stack with Sale Program
- Voucher Card UI (Styled Components + QR/Barcode)
- Avatar Generation Utility
- Markdown Renderer Component
- Late Penalty Logic (15% / 100%)
- Tech Penalty Buttons UI
- Timer Real-time (WebSocket/Polling)
- Extend/Extra Service API
- QR Payment Display + Payment Confirm
- Voucher Design Component
- Voucher Redeem Flow (Customer read -> Tech enter -> Void)
- Voucher Stack with Sale
- Manager Export XLSX/CSV
- Settlement Flow + Ledger
- Avatar Utility + Component
- Markdown Renderer
- Chat Send Voucher
- Voucher Stack Logic (Voucher + Sale)
- Admin Voucher Program Management
- Export XLSX/CSV (Manager/Admin)
Ưu tiên tuyệt đối: Voucher System (Core business) → Late Penalty (Revenue protection) → Tech Job Site Features (Daily ops) → Export/Reports (Management) → Polish/Integration.
Lưu ý: Tất cả API phải có validation, RBAC, audit log. Frontend phải handle loading/error states. Không mock data - dùng API thật. Icon dùng lucide-react. Export dùng xlsx + csv-stringify.
