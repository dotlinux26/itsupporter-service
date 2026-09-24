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
      public_profile: JSON.stringify({
        skills: ['Tra keo gốm/kim loại lỏng', 'Ép xung/Undervolt', 'Vệ sinh linh kiện chuẩn ESD', 'Xử lý kẹt quạt & tra dầu', 'Nâng cấp RAM & SSD NVMe'],
        article: '### Giới thiệu Kỹ thuật viên Nguyễn Đức Cảnh\n- **Đơn vị công tác**: Đội Hỗ trợ Kỹ thuật IT Supporter - Trường Đại học Công nghiệp Hà Nội (HaUI).\n- **Cam kết chất lượng**: Thực hiện đúng quy trình 9 bước vệ sinh & bảo dưỡng máy tính trực tiếp trước sự quan sát của khách hàng.\n- **Chuyên môn nổi bật**: Tháo lắp an toàn chống tĩnh điện ESD, tra keo tản nhiệt hiệu năng cao (Thermal Grizzly / MX-4 / Honeywell PTM7950), tối ưu luồng gió tản nhiệt cho máy tính bàn & laptop gaming.\n- **Kinh nghiệm thực tế**: Đã bảo dưỡng thành công hơn 300+ máy tính cho sinh viên & cán bộ giảng viên tại cơ sở Nhổn & Hà Nam.\n\n*Rất sẵn lòng hỗ trợ các bạn tại Phòng 1603 Tòa A1!*'
      }),
    },
    {
      name: 'Trần Văn Vũ',
      email: 'vu.tech@itsupporter.vn',
      phone: '0981234562',
      avatar_url: null,
      bio: 'Kỹ thuật viên phần cứng giàu kinh nghiệm. Thao tác tỉ mỉ, cẩn thận trên các dòng Laptop Gaming & Workstation.',
      public_profile: JSON.stringify({
        skills: ['Tháo lắp Laptop Gaming', 'Vệ sinh quạt tản nhiệt', 'Nâng cấp RAM & SSD', 'Thay màn hình & bàn phím', 'Tối ưu Windows & Driver'],
        article: '### Giới thiệu Kỹ thuật viên Trần Văn Vũ\n- **Đơn vị công tác**: Đội Kỹ thuật IT Supporter HaUI.\n- **Chuyên môn**: Xử lý chuyên sâu các dòng máy Gaming (Asus TUF/ROG, Acer Nitro/Predator, Lenovo Legion, Dell G-Series) và Workstation.\n- **Nguyên tắc làm việc**: Cẩn thận từng ngàm vỏ, ốc vít; vệ sinh sạch sẽ bụi bẩn vi mạch và bôi trơn quạt tản nhiệt không gây tiếng ồn.\n- **Bảo hành trách nhiệm**: Cam kết hỗ trợ kiểm tra lại máy miễn phí nếu nhiệt độ chưa đạt mức tối ưu.'
      }),
    },
    {
      name: 'Lê Thị Hồng',
      email: 'hong.tech@itsupporter.vn',
      phone: '0981234563',
      avatar_url: null,
      bio: 'Kỹ thuật viên tối ưu phần mềm và hệ thống. Chuyên chẩn đoán nhiệt độ, lỗi xung đột driver và vệ sinh vi mạch.',
      public_profile: JSON.stringify({
        skills: ['Chẩn đoán nhiệt độ stress-test', 'Cài đặt hệ điều hành bản quyền', 'Tối ưu BIOS', 'Vệ sinh vi mạch chuyên sâu', 'Cứu dữ liệu ổ cứng'],
        article: '### Giới thiệu Kỹ thuật viên Lê Thị Hồng\n- **Đơn vị công tác**: Ban Hỗ trợ Kỹ thuật IT Supporter - ĐH Công nghiệp Hà Nội.\n- **Thế mạnh**: Chẩn đoán lỗi phần cứng & phần mềm, tối ưu hóa hệ thống máy tính học tập và văn phòng, giải quyết triệt để lỗi Full Disk và giật lag.\n- **Quy trình chuẩn hóa**: Chụp ảnh tình trạng máy trước/sau khi vệ sinh, đo đạc nhiệt độ Stress Test bằng phần mềm chuyên dụng (FurMark, Cinebench, HWMonitor).'
      }),
    },
    {
      name: 'Phạm Minh Hoàng',
      email: 'hoang.tech@itsupporter.vn',
      phone: '0981234564',
      avatar_url: null,
      bio: 'Kỹ thuật viên bảo trì phần cứng. Nhiệt tình, chu đáo và kiểm tra toàn diện máy tính trước khi bàn giao.',
      public_profile: JSON.stringify({
        skills: ['Bảo dưỡng Laptop mỏng nhẹ', 'Vệ sinh bàn phím & màn hình', 'Kiểm tra pin & nguồn', 'Xử lý máy nóng & tụt pin', 'Tra keo tản nhiệt PTM7950'],
        article: '### Giới thiệu Kỹ thuật viên Phạm Minh Hoàng\n- **Đơn vị công tác**: Đội IT Supporter HaUI.\n- **Chuyên môn**: Bảo dưỡng, vệ sinh chi tiết các dòng Ultrabook & Macbook mỏng nhẹ (Dell XPS, HP Envy/Spectre, ThinkPad, Macbook Air/Pro).\n- **Thao tác chuẩn xác**: Sử dụng bộ dụng cụ cách điện chuyên dụng iFixit, bảo vệ tối đa bề mặt nhôm unibody và các cáp kết nối mỏng.'
      }),
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
    const allSlots = JSON.stringify([
      '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
      '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'
    ]);
    for (let day = 1; day <= 6; day++) {
      db.prepare(`
        INSERT OR REPLACE INTO technician_schedules (technician_id, day_of_week, start_time, end_time, slots, is_active)
        VALUES (?, ?, '07:00', '19:00', ?, 1)
      `).run(userId, day, allSlots);
    }
  }

  // Seed Manager account
  const managerHash = await argon2.hash('Manager123456!', { type: argon2.argon2id });
  const existingManager = db.prepare('SELECT id FROM users WHERE email = ?').get('manager@itsupporter.vn');
  if (existingManager) {
    db.prepare("UPDATE users SET name = 'Quản lý IT Supporter', role = 'MANAGER', status = 'ACTIVE', password_hash = ? WHERE email = 'manager@itsupporter.vn'").run(managerHash);
  } else {
    db.prepare("INSERT INTO users (name, email, password_hash, phone, role, status) VALUES ('Quản lý IT Supporter', 'manager@itsupporter.vn', ?, '0981234560', 'MANAGER', 'ACTIVE')").run(managerHash);
  }

  console.log('Seeded 4 technicians and 1 manager account.');
  closeDb();
}

seed().catch(console.error);
