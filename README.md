# IT Supporter Service

Hệ thống web cung cấp dịch vụ hỗ trợ, vệ sinh và bảo trì máy tính: đặt lịch kỹ thuật viên,
quản lý đơn hàng, trao đổi khách hàng – kỹ thuật viên, thanh toán, tài chính và vận hành nội bộ.

## Kiến trúc

```
itsupporter-service/
├── frontend/   # Vite + React + TypeScript (SPA, responsive)
├── backend/    # Node.js + Express + TypeScript + SQLite (layered)
├── database/   # migrations, seeds, backups
├── scripts/    # create-admin, backup, ...
├── nginx/      # reverse proxy config mẫu
└── uploads/    # avatar, QR, package images
```

## Công nghệ

- **Backend**: Node.js, TypeScript, Express, better-sqlite3, JWT, Argon2id, PM2
- **Frontend**: Vite, React 18, TypeScript, React Router, Zustand
- **Database**: SQLite (transaction, ledger-first cho tài chính)

## Roles

- `GUEST` – khách hàng (mặc định khi register, do admin nâng cấp role)
- `TECHNICIAN` – kỹ thuật viên
- `MANAGER` – quản lý vận hành/tài chính
- `ADMIN` – quản trị hệ thống (chỉ tạo bằng script, không register)

## Bắt đầu (dev)

```bash
npm install
cp .env.example backend/.env
npm run db:init
npm run create-admin
npm run dev
```

- Frontend: http://localhost:5172
- Backend API: http://localhost:4000

## Deployment

### 🚀 CÁC BƯỚC DEPLOY LÊN VPS / SERVER THỰC TẾ:

#### 1. Kéo code về Server:

```bash
git clone https://github.com/dotlinux26/itsupporter-service.git
cd itsupporter-service
npm install
```

#### 2. Cấu hình biến môi trường (`backend/.env`):

Tạo file `backend/.env` từ `.env.example`:

- `PUBLIC_BASE_URL=https://your-domain.com` *(**Rất quan trọng:** Thay localhost bằng domain thật để hyperlink trong tin nhắn Telegram bấm vào mở đúng đơn trên web)*
- `PORT=4000`
- `NODE_ENV=production`
- `JWT_SECRET=chuoi_bi_mat_rat_dai_ngau_nhien`
- `TELEGRAM_BOT_TOKEN=your_telegram_bot_token`
- `TELEGRAM_CHAT_ID=your_telegram_chat_id`
- `TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key`
- `TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key`

#### 3. Chạy Migration Database:

```bash
cd backend
npm run migrate
cd ..
```
*(Nếu là server mới tinh cần khởi tạo dữ liệu mẫu, có thể chạy `npm run db:init` và `npm run create-admin`)*

#### 4. Build Production (cả Backend và Frontend):

```bash
# Build Backend ra backend/dist/
cd backend && npm run build && cd ..

# Build Frontend ra frontend/dist/
cd frontend && npm run build && cd ..
```

#### 5. Khởi chạy tiến trình Backend qua PM2:

```bash
# Chạy background tự khởi động lại khi crash hoặc reboot server
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

#### 6. Cấu hình Nginx & Cấp SSL (Let's Encrypt):

- Copy file mẫu `nginx/itsupporter.conf` vào `/etc/nginx/sites-available/itsupporter.conf` (hoặc tạo symlink sang `/etc/nginx/sites-enabled/`)
- Cập nhật `server_name` thành domain thật của bạn (`your-domain.com`).
- Trỏ thư mục `root` tới thư mục `frontend/dist` đã build (ví dụ `/var/www/itsupporter/frontend/dist` hoặc đường dẫn thư mục dự án).
- Kiểm tra cú pháp và reload Nginx:
  ```bash
  sudo nginx -t
  sudo systemctl reload nginx
  ```
- Cấp chứng chỉ HTTPS miễn phí bằng Certbot:
  ```bash
  sudo certbot --nginx -d your-domain.com -d www.your-domain.com
  sudo systemctl reload nginx
  ```

---

## Chính sách quan trọng

- **Ledger là nguồn sự thật** (`BALANCE IS A RESULT, LEDGER IS THE SOURCE OF TRUTH`).
- Frontend không quyết định role/price/status/balance – backend xác thực mọi thứ.
- Tuyệt đối không `SELECT *` toàn bộ collection để render; dùng pagination (mặc định 10).