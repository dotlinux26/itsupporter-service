import { getDb, closeDb } from '../config/database.js';
import argon2 from 'argon2';

async function seed() {
  const db = getDb();
  const hash = await argon2.hash('Tech123456!', { type: argon2.argon2id });

  const technicians = [
    {
      name: 'Nguyễn Đức Cảnh',
      email: 'canh.tech@itsupporter.vn',
      phone: '0981234561',
      avatar_url: null,
      bio: 'Trưởng ban Kỹ thuật IT Supporter HaUI. Chuyên sâu về sửa chữa, tối ưu phần cứng PC/Laptop và tản nhiệt cao cấp.',
      public_profile: JSON.stringify({ experience_years: 3, skills: ['Tra keo gốm/kim loại lỏng', 'Ép xung/Undervolt', 'Vệ sinh linh kiện chuẩn ESD'] }),
    },
    {
      name: 'Trần Văn Vũ',
      email: 'vu.tech@itsupporter.vn',
      phone: '0981234562',
      avatar_url: null,
      bio: 'Kỹ thuật viên phần cứng giàu kinh nghiệm. Thao tác tỉ mỉ, cẩn thận trên các dòng Laptop Gaming & Workstation.',
      public_profile: JSON.stringify({ experience_years: 2, skills: ['Tháo lắp Laptop Gaming', 'Vệ sinh quạt tản nhiệt', 'Nâng cấp RAM & SSD'] }),
    },
    {
      name: 'Lê Thị Hồng',
      email: 'hong.tech@itsupporter.vn',
      phone: '0981234563',
      avatar_url: null,
      bio: 'Kỹ thuật viên tối ưu phần mềm và hệ thống. Chuyên chẩn đoán nhiệt độ, lỗi xung đột driver và vệ sinh vi mạch.',
      public_profile: JSON.stringify({ experience_years: 2, skills: ['Chẩn đoán nhiệt độ stress-test', 'Cài đặt hệ điều hành bản quyền', 'Tối ưu BIOS'] }),
    },
    {
      name: 'Phạm Minh Hoàng',
      email: 'hoang.tech@itsupporter.vn',
      phone: '0981234564',
      avatar_url: null,
      bio: 'Kỹ thuật viên bảo trì phần cứng. Nhiệt tình, chu đáo và kiểm tra toàn diện máy tính trước khi bàn giao.',
      public_profile: JSON.stringify({ experience_years: 1, skills: ['Bảo dưỡng Laptop mỏng nhẹ', 'Vệ sinh bàn phím & màn hình', 'Kiểm tra pin & nguồn'] }),
    },
  ];

  for (const tech of technicians) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(tech.email) as { id: number } | undefined;
    let userId: number;
    if (existing) {
      userId = existing.id;
      db.prepare(`
        UPDATE users SET name = ?, phone = ?, role = 'TECHNICIAN', status = 'ACTIVE' WHERE id = ?
      `).run(tech.name, tech.phone, userId);
    } else {
      const res = db.prepare(`
        INSERT INTO users (name, email, password_hash, phone, role, status)
        VALUES (?, ?, ?, ?, 'TECHNICIAN', 'ACTIVE')
      `).run(tech.name, tech.email, hash, tech.phone);
      userId = Number(res.lastInsertRowid);
    }

    db.prepare(`
      INSERT OR REPLACE INTO technician_profiles (user_id, bio, public_profile)
      VALUES (?, ?, ?)
    `).run(userId, tech.bio, tech.public_profile);

    // Monday (1) to Saturday (6)
    for (let day = 1; day <= 6; day++) {
      db.prepare(`
        INSERT OR REPLACE INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active)
        VALUES (?, ?, '07:00', '19:00', 1)
      `).run(userId, day);
    }
  }

  console.log('Seeded 4 technicians with profiles and schedules.');
  closeDb();
}

seed().catch(console.error);
