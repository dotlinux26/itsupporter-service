CREATE TABLE orders_new (
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
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED_UNPAID', 'CANCELLED')),
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

INSERT INTO orders_new
SELECT
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
