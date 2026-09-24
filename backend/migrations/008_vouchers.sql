-- Voucher Programs (Chương trình voucher do Admin tạo)
CREATE TABLE voucher_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,           -- Mã chương trình: "WELCOME10", "SALE20"
  name TEXT NOT NULL,                  -- "Chào mừng khách mới 10%"
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,     -- 10, 20, 50, 100 (% hoặc VNĐ)
  max_usage INTEGER DEFAULT 1,         -- Số lần dùng cho 1 user
  valid_from DATETIME,
  valid_to DATETIME,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Voucher Codes (Mã voucher cụ thể phát cho khách)
CREATE TABLE vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES voucher_programs(id),
  code TEXT UNIQUE NOT NULL,           -- Mã duy nhất: "WELCOME10-ABC123"
  customer_id INTEGER REFERENCES users(id),     -- Khách nhận voucher
  technician_id INTEGER REFERENCES users(id),   -- Tech gán voucher (tùy chọn)
  order_id INTEGER REFERENCES orders(id),       -- Đơn áp dụng (sau khi dùng)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'voided')),
  assigned_at DATETIME,
  used_at DATETIME,
  expired_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Voucher Transactions (Lịch sử sử dụng)
CREATE TABLE voucher_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id INTEGER NOT NULL REFERENCES vouchers(id),
  order_id INTEGER NOT NULL REFERENCES orders(id),
  discount_amount INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_customer ON vouchers(customer_id);
CREATE INDEX idx_vouchers_technician ON vouchers(technician_id);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_voucher_transactions_voucher ON voucher_transactions(voucher_id);
CREATE INDEX idx_voucher_transactions_order ON voucher_transactions(order_id);