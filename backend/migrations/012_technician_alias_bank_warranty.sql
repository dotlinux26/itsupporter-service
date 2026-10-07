-- Migration 012: Technician Alias, Bank Account info & QR payment path
ALTER TABLE technician_profiles ADD COLUMN alias TEXT;
ALTER TABLE technician_profiles ADD COLUMN bank_info TEXT;
ALTER TABLE technician_profiles ADD COLUMN bank_qr_path TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_technician_profiles_alias ON technician_profiles(alias);
