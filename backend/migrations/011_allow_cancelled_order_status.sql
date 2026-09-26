-- Migration 011: Allow CANCELLED in orders table status CHECK constraint

DROP TRIGGER IF EXISTS block_delete_financial_transactions;
DROP TRIGGER IF EXISTS block_update_financial_transactions;

CREATE TABLE IF NOT EXISTS orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  technician_id INTEGER REFERENCES users(id),
  package_id INTEGER NOT NULL REFERENCES service_packages(id),
  scheduled_date TEXT NOT NULL,
  scheduled_start TEXT NOT NULL,
  scheduled_end TEXT NOT NULL,
  location TEXT NOT NULL,
  note TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  penalty INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  extend_fee INTEGER NOT NULL DEFAULT 0,
  final_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  completion_result TEXT CHECK (completion_result IN ('SUCCESS', 'FAILED', 'CANCELLED') OR completion_result IS NULL),
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
  unpaid_reason TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  penalty_percent INTEGER NOT NULL DEFAULT 0,
  payment_qr_path TEXT
);

INSERT INTO orders_new SELECT 
  id, code, customer_id, technician_id, package_id, scheduled_date, scheduled_start, scheduled_end,
  location, note, price, penalty, discount, extend_fee, final_amount, status, completion_result,
  payment_status, unpaid_reason, started_at, completed_at, created_at, updated_at, penalty_percent, payment_qr_path
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_technician ON orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_completion_result ON orders(completion_result);

CREATE TRIGGER block_delete_financial_transactions
BEFORE DELETE ON financial_transactions
BEGIN
  SELECT RAISE(ABORT, 'financial_transactions cannot be hard-deleted');
END;

CREATE TRIGGER block_update_financial_transactions
BEFORE UPDATE ON financial_transactions
BEGIN
  SELECT RAISE(ABORT, 'financial_transactions are immutable');
END;
