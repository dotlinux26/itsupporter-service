-- 014: Add TOTP Recovery, 2FA columns to users, and create account_recovery_requests table
ALTER TABLE users ADD COLUMN is_recovery_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN recovery_secret TEXT;
ALTER TABLE users ADD COLUMN recovery_backup_codes TEXT;
ALTER TABLE users ADD COLUMN is_2fa_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT;
ALTER TABLE users ADD COLUMN last_totp_used_at INTEGER;

CREATE TABLE IF NOT EXISTS account_recovery_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username_or_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_account_recovery_requests_status ON account_recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_recovery_requests_created_at ON account_recovery_requests(created_at);
