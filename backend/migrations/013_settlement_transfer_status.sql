-- 013: Add payout status to settlements
ALTER TABLE settlements ADD COLUMN payout_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE settlements ADD COLUMN transferred_at TEXT;
ALTER TABLE settlements ADD COLUMN transferred_by INTEGER REFERENCES users(id);
