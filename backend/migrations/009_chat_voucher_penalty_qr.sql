-- 009: chat voucher messages, voucher transaction type, order late penalty %, technician payment QR
ALTER TABLE order_messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voucher'));
ALTER TABLE order_messages ADD COLUMN voucher_id INTEGER REFERENCES vouchers(id);

ALTER TABLE voucher_transactions ADD COLUMN type TEXT NOT NULL DEFAULT 'REDEEM' CHECK (type IN ('REDEEM', 'SENT'));

ALTER TABLE orders ADD COLUMN penalty_percent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_qr_path TEXT;

CREATE INDEX idx_messages_voucher ON order_messages(voucher_id);