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

Xem `nginx/itsupporter.conf` và `ecosystem.config.cjs`. Mô tả đầy đủ trong whitebook.md (mục deployment).

## Chính sách quan trọng

- **Ledger là nguồn sự thật** (`BALANCE IS A RESULT, LEDGER IS THE SOURCE OF TRUTH`).
- Frontend không quyết định role/price/status/balance – backend xác thực mọi thứ.
- Tuyệt đối không `SELECT *` toàn bộ collection để render; dùng pagination (mặc định 10).