-- 005: financial ledger, settlements, payments
CREATE TABLE financial_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_code TEXT NOT NULL UNIQUE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  technician_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('ORDER_REVENUE', 'TECHNICIAN_SHARE', 'TEAM_SHARE', 'LATE_PENALTY', 'EXTEND_FEE', 'SETTLEMENT', 'REFUND', 'ADJUSTMENT')),
  amount INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT')),
  reference_id TEXT,
  metadata TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bảo vệ tính bất biến của ledger: không cho sửa/xóa hard transaction tài chính.
CREATE TRIGGER block_update_financial_transactions
BEFORE UPDATE ON financial_transactions
BEGIN
  SELECT RAISE(ABORT, 'financial_transactions are immutable');
END;

CREATE TRIGGER block_delete_financial_transactions
BEFORE DELETE ON financial_transactions
BEGIN
  SELECT RAISE(ABORT, 'financial_transactions cannot be hard-deleted');
END;

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  amount INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('QR', 'CASH')),
  status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'UNPAID')),
  reason TEXT,
  qr_config_id INTEGER REFERENCES qr_configs(id),
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settlement_code TEXT NOT NULL UNIQUE,
  technician_id INTEGER NOT NULL REFERENCES users(id),
  manager_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'FAILED')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);