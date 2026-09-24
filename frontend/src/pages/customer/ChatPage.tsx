import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, orderApi, voucherApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { VoucherCard } from '../../components/VoucherCard';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Send, Gift, Ticket, ArrowLeft } from 'lucide-react';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newMessage, setNewMessage] = useState('');
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [voucherPrograms, setVoucherPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [giftNote, setGiftNote] = useState('');
  const [gifting, setGifting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Order Details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      const res = await orderApi.get(Number(id));
      return res.data.data;
    },
    enabled: !!id,
  });

  // Real-time Chat Messages with TanStack Query Polling (refetchInterval: 3000ms)
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['order-messages', id],
    queryFn: async () => {
      const res = await chatApi.list(Number(id));
      return res.data.data;
    },
    refetchInterval: 3000,
    enabled: !!id,
  });

  // Mark Read on mount
  useEffect(() => {
    if (id) {
      chatApi.markRead(Number(id)).catch(() => {});
    }
  }, [id, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatApi.send(Number(id!), msg),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['order-messages', id] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMutation.isPending) return;
    sendMutation.mutate(newMessage.trim());
  };

  // Load programs for gifting voucher
  const handleOpenGiftModal = async () => {
    setShowGiftModal(true);
    try {
      const res = await voucherApi.programs();
      const list = res.data.data || [];
      setVoucherPrograms(list.filter((p: any) => p.is_active));
      if (list.length > 0) setSelectedProgramId(list[0].id);
    } catch (err) {
      console.error('Failed to load voucher programs:', err);
    }
  };

  // Gift voucher handler
  const handleGiftVoucher = async () => {
    if (!selectedProgramId || !id) return;
    setGifting(true);
    try {
      // 1. Generate a single-use voucher code for customer
      const genRes = await voucherApi.generateCodes(selectedProgramId, 1, order?.customer_id);
      const generatedVouchers = genRes.data.data || [];
      const voucher = generatedVouchers[0];

      if (voucher && voucher.id) {
        // 2. Send voucher directly into chat
        await chatApi.sendVoucher(Number(id), voucher.id, giftNote || '🎁 Kỹ thuật viên gửi tặng bạn voucher ưu đãi cho lần dịch vụ tiếp theo!');
        queryClient.invalidateQueries({ queryKey: ['order-messages', id] });
        setShowGiftModal(false);
        setGiftNote('');
      }
    } catch (err) {
      console.error('Failed to gift voucher:', err);
      alert('Không thể gửi voucher. Vui lòng thử lại.');
    } finally {
      setGifting(false);
    }
  };

  const isStaff = user?.role === 'TECHNICIAN' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  if (orderLoading || messagesLoading) {
    return (
      <div className="container py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">Không tìm thấy đơn hàng</h1>
        <Link to="/orders" className="btn btn-primary">Quay lại danh sách đơn</Link>
      </div>
    );
  }

  const otherPersonName =
    user?.role === 'TECHNICIAN'
      ? order.customer_name || 'Khách hàng'
      : order.technician_name || 'Kỹ thuật viên';

  return (
    <div className="container py-6 max-w-4xl h-[calc(100vh-140px)] flex flex-col">
      {/* Header bar */}
      <div className="card p-4 mb-4 flex items-center justify-between border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to={user?.role === 'TECHNICIAN' ? `/technician/orders/${id}` : `/orders/${id}`}
            className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
            title="Quay lại chi tiết đơn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Avatar name={otherPersonName} size={38} />
            <div>
              <h2 className="text-base font-bold text-text leading-tight">{otherPersonName}</h2>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <span>Mã đơn: <strong className="text-orange-600 font-mono font-semibold">{order.code}</strong></span>
                <span>•</span>
                <span>{order.package_name}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Đang kết nối thời gian thực" />
              </div>
            </div>
          </div>
        </div>

        {isStaff && (
          <button
            onClick={handleOpenGiftModal}
            className="btn btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center gap-1.5 text-xs py-1.5 px-3"
            type="button"
          >
            <Gift className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">Tặng Voucher</span>
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="card flex-1 p-4 overflow-y-auto mb-4 border border-border space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-12">
            <Ticket className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">Chưa có tin nhắn nào trong đơn này</p>
            <p className="text-xs text-gray-400 mt-1">
              Bạn và kỹ thuật viên có thể trao đổi trực tiếp về yêu cầu máy móc, tình trạng hoặc gửi voucher ưu đãi tại đây.
            </p>
          </div>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.sender_id === user?.id;
            const isVoucher = msg.message_type === 'voucher' && msg.voucher_code;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar
                  name={msg.sender_name || (isMe ? user?.name : otherPersonName)}
                  size={32}
                  className="flex-shrink-0 mt-0.5"
                />

                <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1 px-1">
                    <span className="font-semibold text-gray-700">{msg.sender_name}</span>
                    <span>•</span>
                    <span>{format(new Date(msg.created_at), 'HH:mm', { locale: vi })}</span>
                  </div>

                  {isVoucher ? (
                    <div className="space-y-2">
                      {msg.message && (
                        <div
                          className={`p-3 rounded-2xl text-sm ${
                            isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white border border-border text-text rounded-tl-none shadow-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                      )}
                      <div className="my-1">
                        <VoucherCard
                          code={msg.voucher_code}
                          name={msg.voucher_name || 'Voucher tặng bạn'}
                          discountType={msg.voucher_discount_type || 'percent'}
                          discountValue={msg.voucher_discount_value || 10}
                          status={msg.voucher_status || 'active'}
                          validTo={msg.voucher_valid_to}
                          compact
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-orange-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-white border border-border text-text rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn trao đổi với kỹ thuật viên..."
          className="input flex-1 bg-white border-border shadow-sm text-sm"
          disabled={sendMutation.isPending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sendMutation.isPending}
          className="btn btn-primary flex items-center gap-1.5 px-5 shadow-sm"
        >
          {sendMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </form>

      {/* Modal: Tặng Voucher cho khách */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-4 text-orange-600">
              <Gift className="w-6 h-6" />
              <h2 className="text-xl font-bold text-text">Tặng Voucher cho khách hàng</h2>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Voucher sẽ được tạo mới và gửi trực tiếp dưới dạng thẻ vé ưu đãi vào khung chat này cho khách.
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Chọn chương trình ưu đãi</label>
                <select
                  value={selectedProgramId || ''}
                  onChange={(e) => setSelectedProgramId(Number(e.target.value))}
                  className="input"
                >
                  {voucherPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.discount_type === 'percent' ? `-${p.discount_value}%` : `-${p.discount_value.toLocaleString('vi-VN')}đ`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Lời nhắn đính kèm</label>
                <textarea
                  rows={2}
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="VD: Cảm ơn bạn đã tin tưởng dịch vụ! Gửi tặng bạn voucher giảm 20% cho lần bảo trì tiếp theo."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowGiftModal(false)}
                  className="btn btn-ghost"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleGiftVoucher}
                  disabled={gifting || !selectedProgramId}
                  className="btn btn-primary flex items-center gap-1.5"
                >
                  {gifting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Gửi tặng ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}