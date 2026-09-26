import { useSEO } from '../../hooks/useSEO';

export function TermsPage() {
  useSEO({
    title: 'Quy Định Dịch Vụ & Cam Kết Chất Lượng | IT Supporter HaUI',
    description: 'Quy định đặt lịch, chính sách cam kết đúng giờ (trễ 30 phút miễn phí 100%), quy trình bảo dưỡng vệ sinh máy tính minh bạch của IT Supporter HaUI.',
    keywords: 'quy định it supporter, cam kết đúng giờ vệ sinh máy tính, chính sách bảo hành vệ sinh laptop haui',
    canonical: 'https://itsupporter.vn/terms',
  });

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Quy định & Cam kết dịch vụ</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2">
          Các điều khoản minh bạch, quyền lợi và cam kết phục vụ chuẩn xác giữa khách hàng và kỹ thuật viên.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Dành cho khách hàng</h2>
          <ul className="space-y-2 text-text-secondary">
            <li>• <strong>Quy định đặt lịch:</strong> Khách hàng cần đặt lịch trước <strong>tối thiểu 4 tiếng</strong> và tối đa 30 ngày để đảm bảo kỹ thuật viên chuẩn bị đầy đủ trang thiết bị và vật tư chuyên dụng.</li>
            <li>• <strong>Quy định đổi lịch:</strong> Có thể đổi lịch tối thiểu 2 tiếng trước giờ hẹn, tùy theo tình trạng trống lịch của kỹ thuật viên.</li>
            <li>• <strong>Quy định hủy đơn:</strong> Hủy miễn phí nếu hủy trước 2 tiếng. Hủy sau 2 tiếng sẽ bị tính phí dịch chuyển 15% giá trị đơn.</li>
            <li>• <strong>Cam kết đúng giờ & Phạt vi phạm:</strong>
              <ul className="pl-6 mt-1 space-y-1 list-disc text-sm">
                <li>Đến muộn 10 – 29 phút: Giảm ngay 15% tổng giá trị đơn hàng.</li>
                <li>Đến muộn ≥ 30 phút: <strong>MIỄN PHÍ 100% (0 VNĐ)</strong> cho khách hàng. Kỹ thuật viên/Hệ thống kích hoạt chế độ vi phạm để kết toán 0 đồng.</li>
              </ul>
            </li>
            <li>• <strong>Quy định Voucher & Khuyến mãi:</strong>
              <ul className="pl-6 mt-1 space-y-1 list-disc text-sm">
                <li>Chương trình khuyến mãi chung (Sale Event): Được áp dụng trực tiếp tại ca làm việc.</li>
                <li>Mã Voucher quà tặng (Gift Voucher): Mã quà tặng dùng 1 lần nhận qua khung chat hoặc email, có thể cộng dồn ưu đãi tri ân khách hàng thân thiết.</li>
              </ul>
            </li>
            <li>• <strong>Quy định thanh toán:</strong> Thanh toán chuyển khoản qua mã QR Ngân hàng VietQR chuẩn xác hoặc tiền mặt ngay khi hoàn thành dịch vụ.</li>
            <li>• <strong>Quy định sử dụng dịch vụ:</strong> Khách hàng chuẩn bị máy tính tại vị trí có ổ cắm điện và ánh sáng thuận tiện.</li>
            <li>• <strong>Quy định đánh giá:</strong> Khách hàng có thể viết đánh giá kèm nội dung Markdown sau khi đơn hoàn tất (1-5 sao).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Dành cho kỹ thuật viên</h2>
          <ul className="space-y-2 text-text-secondary">
            <li>• <strong>Quy định nhận đơn:</strong> Kỹ thuật viên chỉ nhận đơn khi có mặt trong ca trực và sẵn sàng trước giờ hẹn.</li>
            <li>• <strong>Quy định tác phong & Giờ giấc:</strong> Phải có mặt đúng giờ hẹn. Nếu trễ từ 10 - 29 phút bị giảm 15% doanh thu ca. Nếu trễ ≥ 30 phút, kỹ thuật viên có trách nhiệm bấm xác nhận vi phạm làm <strong>MIỄN PHÍ 100%</strong> cho khách hàng.</li>
            <li>• <strong>Quy định thực hiện đơn:</strong> Thực hiện theo đúng quy trình 9 bước vệ sinh, chống tĩnh điện ESD, tra keo tản nhiệt chất lượng cao.</li>
            <li>• <strong>Quy định Voucher & Khuyến mãi:</strong> Nhập chính xác mã Voucher do khách hàng cung cấp (hệ thống sẽ lập tức gạch mã dùng 1 lần) và gửi tặng Voucher tri ân qua khung chat sau khi nghiệm thu.</li>
            <li>• <strong>Quy định thanh toán:</strong> Thu đúng số tiền cuối cùng hiển thị trên đơn, hiển thị mã VietQR cho khách quét và cập nhật trạng thái thanh toán ngay khi có xác nhận.</li>
            <li>• <strong>Quy định trách nhiệm:</strong> Chịu trách nhiệm bảo dưỡng toàn diện, bảo đảm an toàn dữ liệu và phần cứng của khách.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Khiếu nại</h2>
          <p className="text-text-secondary mb-4">Nếu có khiếu nại hoặc cần hỗ trợ, vui lòng liên hệ qua các kênh chính thức:</p>
          <ul className="space-y-2 text-text-secondary">
            <li>
              Fanpage Facebook:{' '}
              <a 
                href="https://www.facebook.com/itsupporter.haui/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-blue-300 underline-offset-2"
              >
                IT Supporter HaUI
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}