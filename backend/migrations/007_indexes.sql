-- 007: indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_technician ON orders(technician_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_completion_result ON orders(completion_result);

CREATE INDEX idx_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_messages_order ON order_messages(order_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_reviews_created ON reviews(created_at);
CREATE INDEX idx_reviews_technician ON reviews(technician_id);

CREATE INDEX idx_financial_technician ON financial_transactions(technician_id);
CREATE INDEX idx_financial_order ON financial_transactions(order_id);
CREATE INDEX idx_financial_created ON financial_transactions(created_at);
CREATE INDEX idx_financial_type ON financial_transactions(type);

CREATE INDEX idx_settlements_technician ON settlements(technician_id);
CREATE INDEX idx_availability_tech_date ON technicians_availability(technician_id, date);
CREATE INDEX idx_reschedule_order ON reschedule_requests(order_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);