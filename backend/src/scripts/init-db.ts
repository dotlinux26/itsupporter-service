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
    description: 'Vệ sinh máy cơ bản và thay keo tản nhiệt thông thường.',
    price: 50000,
    duration_minutes: 60,
    features: JSON.stringify(['Tra keo tản nhiệt thông thường', 'Vệ sinh máy cơ bản']),
    display_order: 1,
    image: null as string | null,
  },
  {
    name: 'PREMIUM',
    description: 'Vệ sinh máy chi tiết, kiểm tra toàn diện và hỗ trợ cài đặt phần mềm.',
    price: 100000,
    duration_minutes: 60,
    features: JSON.stringify([
      'Tra keo tản nhiệt chất lượng cao',
      'Vệ sinh máy chi tiết',
      'Kiểm tra tình trạng máy',
      'Kiểm tra phần mềm',
      'Hỗ trợ làm sạch hệ thống',
      'Hỗ trợ cài đặt phần mềm nếu khách yêu cầu',
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