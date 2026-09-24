import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, orderApi, voucherApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { VoucherCard } from '../../components/VoucherCard';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Send, Gift, ArrowLeft, ExternalLink, Mail, MessageSquare } from 'lucide-react';

/** Helper to parse SQLite UTC datetime string into local Date object */
function parseUtcDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.endsWith('Z') || dateStr.includes('+')) {
    return new Date(dateStr);
  }
  return new Date(dateStr.replace(' ', 'T') + 'Z');
}

/** 
 * Safe Message Renderer:
 * - 100% XSS safe (all raw strings rendered via standard JSX text nodes)
 * - Safely auto-detects http/https URLs and email addresses as clickable styled links
 */
function SafeChatMessage({ content, isMe }: { content: string; isMe: boolean }) {
  if (!content) return null;

  const tokenRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const parts = content.split(tokenRegex);

  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed text-sm">
      {parts.map((part, index) => {
        if (!part) return null;

        // Check if URL (only http:// and https:// allowed)
        if (/^https?:\/\//i.test(part)) {
          const cleanUrl = part.replace(/[.,;!?)]+$/, '');
          const trailing = part.slice(cleanUrl.length);
          return (
            <span key={index}>
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 break-all ${
                  isMe
                    ? 'text-amber-100 hover:text-white'
                    : 'text-orange-600 hover:text-orange-700'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5 inline-block flex-shrink-0" />
                <span>{cleanUrl}</span>
              </a>
              {trailing}
            </span>
          );
        }

        // Check if Email
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(part)) {
          return (
            <a
              key={index}
              href={`mailto:${part}`}
              className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 break-all ${
                isMe
                  ? 'text-amber-100 hover:text-white'
                  : 'text-orange-600 hover:text-orange-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-3.5 h-3.5 inline-block flex-shrink-0" />
              <span>{part}</span>
            </a>
          );
        }

        // Standard text is escaped automatically by React JSX
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

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

  // References for focused control and internal-only scrolling
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Internal-only Auto Scroll to bottom (does NOT scroll the outer window)
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatApi.send(Number(id!), msg),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['order-messages', id] });
      // Restore input focus immediately after send
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
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
      const activeList = list.filter((p: any) => p.is_active);
      setVoucherPrograms(activeList);
      if (activeList.length > 0) setSelectedProgramId(activeList[0].id);
    } catch (err) {
      console.error('Failed to load voucher programs:', err);
    }
  };

  // Gift voucher handler
  const handleGiftVoucher = async () => {
    if (!selectedProgramId || !id) return;
    setGifting(true);
    try {
      const genRes = await voucherApi.generateCodes(selectedProgramId, 1, order?.customer_id);
      const generatedVouchers = genRes.data.data || [];
      const voucher = generatedVouchers[0];

      if (voucher && voucher.id) {
        await chatApi.sendVoucher(
          Number(id),
          voucher.id,
          giftNote || '🎁 Kỹ thuật viên gửi tặng bạn voucher ưu đãi cho lần dịch vụ tiếp theo!'
        );
        queryClient.invalidateQueries({ queryKey: ['order-messages', id] });
        setShowGiftModal(false);
        setGiftNote('');
        inputRef.current?.focus();
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
      <div className="container max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">Không tìm thấy đơn hàng</h1>
        <Link to="/orders" className="btn btn-primary">Quay lại danh sách đơn</Link>
      </div>
    );
  }

  const otherPersonName =
    user?.role === 'TECHNICIAN'
      ? order.customer_name || 'Khách hàng'
      : order.technician_name || 'Kỹ thuật viên';

  const backUrl =
    user?.role === 'TECHNICIAN'
      ? `/technician/orders/${id}`
      : user?.role === 'MANAGER'
      ? `/manager/orders`
      : `/orders/${id}`;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4.5rem)] min-h-[550px]">
      {/* Main Chat Container Box */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        
        {/* Chat Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-border bg-white flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Link
              to={backUrl}
              className="p-2 rounded-xl hover:bg-gray-100 text-text-secondary transition-colors"
              title="Quay lại chi tiết đơn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Avatar name={otherPersonName} size={40} />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text leading-tight">{otherPersonName}</h2>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <span>Mã đơn: <strong className="text-orange-600 font-mono font-semibold">{order.code}</strong></span>
                  <span>•</span>
                  <span className="hidden sm:inline">{order.package_name}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Trực tuyến
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isStaff && (
            <button
              onClick={handleOpenGiftModal}
              className="btn btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl shadow-xs"
              type="button"
            >
              <Gift className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline font-semibold">Tặng Voucher</span>
            </button>
          )}
        </div>

        {/* Scrollable Message List (Self-contained scroll area) */}
        <div
          ref={chatScrollRef}
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/70"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-12 px-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-gray-700">Khung trò chuyện trực tiếp</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Bạn và kỹ thuật viên có thể trao đổi trực tiếp về tình trạng máy móc, gửi liên kết tham khảo hoặc tặng voucher ưu đãi.
              </p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.sender_id === user?.id;
              const isVoucher = msg.message_type === 'voucher' && msg.voucher_code;
              const parsedDate = parseUtcDate(msg.created_at);

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

                  <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Timestamp & Sender info formatted with Vietnam local time */}
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1 px-1">
                      <span className="font-semibold text-gray-700">{msg.sender_name}</span>
                      <span>•</span>
                      <span title={format(parsedDate, 'HH:mm:ss, EEEE dd/MM/yyyy', { locale: vi })}>
                        {format(parsedDate, 'HH:mm • dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>

                    {isVoucher ? (
                      <div className="space-y-2">
                        {msg.message && (
                          <div
                            className={`p-3 sm:p-3.5 rounded-2xl text-sm ${
                              isMe
                                ? 'bg-orange-600 text-white rounded-tr-none shadow-xs'
                                : 'bg-white border border-border text-text rounded-tl-none shadow-xs'
                            }`}
                          >
                            <SafeChatMessage content={msg.message} isMe={isMe} />
                          </div>
                        )}
                        <div className="my-1">
                          <VoucherCard
                            code={msg.voucher_code}
                            name={msg.voucher_name || 'Voucher quà tặng'}
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
                        className={`p-3 sm:p-3.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-orange-600 text-white rounded-tr-none shadow-xs'
                            : 'bg-white border border-border text-text rounded-tl-none shadow-xs'
                        }`}
                      >
                        <SafeChatMessage content={msg.message} isMe={isMe} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 border-t border-border bg-white z-10">
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn (hỗ trợ gửi link website, email)..."
              className="input flex-1 bg-slate-50 focus:bg-white border-border text-sm py-2.5 rounded-xl transition"
              disabled={sendMutation.isPending}
              autoFocus
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendMutation.isPending}
              className="btn btn-primary flex items-center gap-1.5 px-5 py-2.5 rounded-xl shadow-xs"
            >
              {sendMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline font-medium">Gửi</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Tặng Voucher cho khách */}
      {showGiftModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowGiftModal(false)}
        >
          <div
            className="card max-w-md w-full p-6 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
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
                {voucherPrograms.length === 0 ? (
                  <p className="text-xs text-red-500 py-2">Hiện chưa có chương trình voucher nào đang kích hoạt.</p>
                ) : (
                  <select
                    value={selectedProgramId || ''}
                    onChange={(e) => setSelectedProgramId(Number(e.target.value))}
                    className="input"
                  >
                    {voucherPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.discount_type === 'percent' ? `-${p.discount_value}%` : `-${Number(p.discount_value).toLocaleString('vi-VN')}đ`})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="label">Lời nhắn đính kèm</label>
                <textarea
                  rows={2}
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="VD: Cảm ơn bạn đã tin tưởng dịch vụ! Gửi tặng bạn voucher ưu đãi cho lần bảo dưỡng tiếp theo."
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