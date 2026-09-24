import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { publicApi } from '../../api/client';

export function AboutPage() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<any>({
    team_name: 'IT Supporter HaUI',
    university: 'Trường Đại học Công nghiệp Hà Nội',
    workshop_address: 'Phòng 1603, Tòa A1, Cơ sở 1 - Đại học Công nghiệp Hà Nội',
    contact_phone: '0981.234.567',
    email: 'support@itsupporter.vn',
    facebook_page: 'https://www.facebook.com/itsupporter.haui/',
    distributor_name: 'dotlinux26',
    distributor_url: 'https://github.com/dotlinux26',
  });

  useEffect(() => {
    publicApi.info().then(res => {
      if (res.data?.data) {
        setInfo((prev: any) => ({ ...prev, ...res.data.data }));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="container py-10 md:py-12 max-w-4xl mx-auto">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Về chúng tôi - {info.team_name}</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2">
          Đội ngũ kỹ thuật viên sinh viên nhiệt huyết, được đào tạo bài bản về vệ sinh và bảo dưỡng phần cứng PC/Laptop tại {info.university}.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Giới thiệu dịch vụ</h2>
          <p className="text-text-secondary leading-relaxed">
            {info.team_name} là dịch vụ vệ sinh, bảo trì máy tính chuyên nghiệp, 
            giúp khách hàng dễ dàng đặt lịch trước online và mang máy tới phòng làm việc để kỹ thuật viên kiểm tra & xử lý trực tiếp.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Đội ngũ & Vận hành</h2>
          <p className="text-text-secondary leading-relaxed">
            Dự án được xây dựng và vận hành bởi <strong>Đội {info.team_name}</strong> ({info.university}) - 
            tập hợp các kỹ thuật viên sinh viên nhiệt huyết, được đào tạo bài bản về kỹ thuật máy tính, quy trình tháo lắp chống tĩnh điện và bảo trì phần cứng PC/Laptop chuyên nghiệp.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Mục đích</h2>
          <p className="text-text-secondary leading-relaxed">
            Cung cấp dịch vụ IT chất lượng cao, minh bạch, công bằng cho cả khách hàng và kỹ thuật viên.
            Xây dựng hệ sinh thái dịch vụ IT tin cậy, chuyên nghiệp tại Việt Nam.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">Dịch vụ</h2>
          <ul className="space-y-2 text-text-secondary">
            <li>• Vệ sinh máy tính cơ bản và cao cấp</li>
            <li>• Tra keo tản nhiệt (gốm cao cấp / kim loại lỏng)</li>
            <li>• Kiểm tra tình trạng phần cứng & Stress-test nhiệt độ</li>
            <li>• Kiểm tra và cài đặt phần mềm</li>
            <li>• Hỗ trợ làm sạch hệ thống, cài đặt phần mềm theo yêu cầu</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-text mb-4">{t('home.footer.contact')}</h2>
          <ul className="space-y-2 text-text-secondary">
            <li>Hotline: <a href={`tel:${info.contact_phone?.replace(/\./g, '')}`} className="font-semibold text-orange-600 hover:underline">{info.contact_phone}</a></li>
            <li>Email: <a href={`mailto:${info.email}`} className="text-blue-600 hover:underline">{info.email}</a></li>
            <li>
              Fanpage Facebook:{' '}
              <a 
                href={info.facebook_page} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-blue-300 underline-offset-2"
              >
                {info.team_name}
              </a>
            </li>
            <li>Địa chỉ phòng tiếp nhận máy: <strong>{info.workshop_address}</strong></li>
            <li>Đơn vị trực thuộc: {info.university}</li>
            <li>
              Nhà phân phối chính thức:{' '}
              <a 
                href={info.distributor_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-orange-600 hover:text-orange-700 font-semibold underline decoration-orange-300 underline-offset-2"
              >
                {info.distributor_name}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}