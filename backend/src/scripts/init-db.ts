import { getDb, closeDb } from '../config/database.js';
import { runMigrations } from './migrate.js';
import logger from '../utils/logger.js';

const DEFAULT_SETTINGS: Array<[string, string, string]> = [
  ['late_penalty_minutes', '10', 'Số phút muộn khiến order bị phạt'],
  ['late_penalty_percent', '15', 'Phần trăm giá trị order bị trừ khi muộn'],
  ['free_service_after_minutes', '45', 'Số phút muộn tối đa trước khi dịch vụ miễn phí'],
  ['working_start', '07:00', 'Giờ làm việc bắt đầu'],
  ['working_end', '19:00', 'Giờ làm việc kết thúc'],
  ['slot_duration_minutes', '60', 'Thời lượng mỗi slot'],
  ['timezone', 'Asia/Ho_Chi_Minh', 'Múi giờ hệ thống — giờ Việt Nam (UTC+7), tức giờ Hà Nội'],
  ['technician_share_percent', '70', 'Phần trăm doanh thu thuộc về technician'],
  ['team_share_percent', '30', 'Phần trăm doanh thu thuộc về đội/IT Supporter'],
];

const DEFAULT_PACKAGES = [
  {
    name: 'BASIC',
    description: 'Quy trình 9 bước vệ sinh vi mạch an toàn chống tĩnh điện ESD, làm sạch bụi bẩn buồng tản nhiệt và thay keo tản nhiệt tiêu chuẩn chính hãng Arctic MX-4 / Noctua NT-H1.',
    price: 50000,
    duration_minutes: 60,
    features: JSON.stringify([
      'Quy trình 9 bước vệ sinh vi mạch chống tĩnh điện an toàn ESD',
      'Làm sạch quạt gió & thổi bụi khe tản nhiệt chuyên sâu',
      'Tra keo tản nhiệt Arctic MX-4 / Noctua NT-H1 chính hãng',
      'Kiểm tra nhiệt độ CPU & GPU trước/sau bảo dưỡng',
    ]),
    display_order: 1,
    image: null as string | null,
  },
  {
    name: 'PREMIUM',
    description: 'Quy trình 9 bước chuyên sâu cho Laptop Gaming & Workstation. Sử dụng keo tản nhiệt cao cấp Thermal Grizzly Kryonaut / Honeywell PTM7950 & tra dầu bôi trơn trục quạt.',
    price: 100000,
    duration_minutes: 60,
    features: JSON.stringify([
      'Quy trình 9 bước vệ sinh vi mạch chống tĩnh điện ESD toàn diện',
      'Tra keo tản nhiệt cao cấp Thermal Grizzly Kryonaut / Honeywell PTM7950',
      'Tháo rời cánh quạt, vệ sinh kỹ & tra dầu bôi trơn trục quạt êm ái',
      'Làm sạch chi tiết các cổng cắm (Type-C, USB, HDMI, Jack Audio)',
      'Stress-test hiệu năng & Tối ưu luồng gió tản nhiệt',
      'Hỗ trợ kiểm tra phần mềm, dọn rác Windows & cập nhật Driver',
    ]),
    display_order: 2,
    image: null as string | null,
  },
];

function seedDefaults(db: ReturnType<typeof getDb>): void {
  const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)');
  for (const [key, value, description] of DEFAULT_SETTINGS) {
    insertSetting.run(key, value, description);
  }

  const exists = db.prepare('SELECT COUNT(*) AS c FROM service_packages').get() as { c: number };
  if (exists.c > 0) {
    logger.info('Service packages already seeded');
    return;
  }

  const insertPackage = db.prepare(`
    INSERT INTO service_packages (name, description, price, duration_minutes, features, display_order, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const pkg of DEFAULT_PACKAGES) {
    insertPackage.run(
      pkg.name,
      pkg.description,
      pkg.price,
      pkg.duration_minutes,
      pkg.features,
      pkg.display_order,
      pkg.image
    );
  }
  logger.info('Seeded default service packages');
}

const isMain = process.argv[1] !== undefined && process.argv[1].endsWith('init-db.ts');
if (isMain) {
  const db = getDb();
  try {
    runMigrations();
    seedDefaults(db);
    console.log('Database initialized.');
  } catch (err) {
    console.error('Database init failed:', err);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}