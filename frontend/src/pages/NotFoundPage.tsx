import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-primary-light mb-4">404</h1>
        <h2 className="text-2xl font-bold text-text mb-4">Trang không tồn tại</h2>
        <p className="text-text-secondary mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <Link to="/" className="btn btn-primary inline-block">
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}