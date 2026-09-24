import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { technicianApi } from '../../api/client';
import { format } from 'date-fns';

export function TechnicianSchedule() {
  const { t } = useTranslation();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, [date]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const response = await technicianApi.schedule(date);
      setSchedule(response.data.data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 md:py-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">{t('technician.mySchedule')}</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm text-text-secondary">{t('booking.selectDate')}</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input w-auto"
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 h-24 bg-gray-100 rounded" />
          ))}
        </div>
      ) : schedule.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-text-secondary">Không có đơn hàng nào trong ngày này</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedule.map((order) => (
            <div key={order.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">{order.code}</h3>
                    <p className="text-sm text-text-secondary">{order.package_name}</p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end md:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${order.status === 'PENDING' ? 'badge-pending' :
                                          order.status === 'CONFIRMED' ? 'badge-confirmed' :
                                          order.status === 'IN_PROGRESS' ? 'badge-in_progress' :
                                          order.status === 'COMPLETED' ? 'badge-completed' : 'badge-cancelled'}`}>
                      {order.status === 'PENDING' ? 'Chờ xác nhận' :
                       order.status === 'CONFIRMED' ? 'Đã xác nhận' :
                       order.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
                       order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>{order.scheduled_start} - {order.scheduled_end}</span>
                    <span>{order.customer_name}</span>
                    <span>{order.location}</span>
                  </div>
                  <a href={`/technician/orders/${order.id}`} className="btn btn-primary btn-sm">{t('common.view')}</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}