-- 015: Update official contact information and workshop location for SEO & system defaults
INSERT INTO system_settings (key, value, description, updated_at)
VALUES
  ('contact_phone', '0337.616.423', 'Hotline kỹ thuật', datetime('now')),
  ('contact_email', 'it.supporter@fit-haui.edu.vn', 'Email hỗ trợ chính thức', datetime('now')),
  ('workshop_address', 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội', 'Địa chỉ phòng làm việc tiếp nhận', datetime('now')),
  ('working_hours_display', '07:00 - 19:00 (Thứ 2 - Thứ 7)', 'Khung giờ tiếp nhận làm việc', datetime('now'))
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  description = excluded.description,
  updated_at = excluded.updated_at;
