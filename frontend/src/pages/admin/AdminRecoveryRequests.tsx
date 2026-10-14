import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  User,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { adminApi } from '../../api/client';
import type { AccountRecoveryRequest } from '../../types';

export const AdminRecoveryRequests: React.FC = () => {
  const [requests, setRequests] = useState<AccountRecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Action modals state
  const [selectedRequest, setSelectedRequest] = useState<AccountRecoveryRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{
    temporaryPassword?: string;
    message?: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminApi.recoveryRequests({
        status: statusFilter || undefined,
        limit: 50,
      });
      const data = res.data?.data || res.data || [];
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch recovery requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const res = await adminApi.approveRecoveryRequest(selectedRequest.id, adminNotes);
      setApprovalResult(res.data);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi phê duyệt yêu cầu.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      await adminApi.rejectRecoveryRequest(selectedRequest.id, adminNotes);
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi từ chối yêu cầu.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPass = (pass?: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const filtered = requests.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.username_or_email.toLowerCase().includes(q) ||
      r.full_name.toLowerCase().includes(q) ||
      r.contact_phone.includes(q) ||
      (r.reason && r.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Yêu cầu Cứu trợ Tài khoản (Helpdesk)</h1>
            <p className="text-xs text-slate-400">Quản lý và xét duyệt các yêu cầu mất thiết bị 2FA & khôi phục</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tài khoản, họ tên, SĐT..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý (PENDING)</option>
            <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
            <option value="REJECTED">Đã từ chối (REJECTED)</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Mã & Ngày gửi</th>
                <th className="py-3.5 px-4 font-semibold">Tài khoản & Chủ sở hữu</th>
                <th className="py-3.5 px-4 font-semibold">Liên hệ</th>
                <th className="py-3.5 px-4 font-semibold">Lý do & Mô tả</th>
                <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                <th className="py-3.5 px-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                    Đang tải danh sách yêu cầu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                    Không có yêu cầu cứu trợ nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-white">#REC-{req.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleString('vi-VN')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-rose-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {req.username_or_email}
                      </div>
                      <div className="text-white text-xs mt-0.5">{req.full_name}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                        <Phone className="w-3 h-3" /> {req.contact_phone}
                      </div>
                      {req.contact_email && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3" /> {req.contact_email}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-300 text-xs" title={req.reason}>
                        {req.reason}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {req.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Chờ xử lý
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Đã phê duyệt
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Đã từ chối
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('APPROVE');
                              setApprovalResult(null);
                              setAdminNotes('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                          >
                            Duyệt cấp mật khẩu
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('REJECT');
                              setApprovalResult(null);
                              setAdminNotes('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">
                          {req.status === 'APPROVED' ? 'Đã cấp mật khẩu tạm' : 'Đã hủy yêu cầu'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal (Approve / Reject) */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {actionType === 'APPROVE' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Phê duyệt & Cấp mật khẩu tạm
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  Từ chối yêu cầu cứu trợ
                </>
              )}
            </h3>

            {/* If approved and result received, show password card */}
            {approvalResult ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                <p className="text-xs text-emerald-200">
                  Hệ thống đã reset toàn bộ 2FA và mã khôi phục cũ của tài khoản. Dưới đây là mật khẩu tạm thời:
                </p>
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-emerald-500/40">
                  <code className="text-sm font-mono font-bold text-emerald-400 flex-1 tracking-wider">
                    {approvalResult.temporaryPassword}
                  </code>
                  <button
                    onClick={() => handleCopyPass(approvalResult.temporaryPassword)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    title="Sao chép"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hãy gửi mật khẩu này cho chủ tài khoản qua SĐT: <b>{selectedRequest.contact_phone}</b>. Nhắc họ đổi lại mật khẩu và cài đặt lại 2FA sau khi đăng nhập.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setActionType(null);
                      setApprovalResult(null);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tài khoản: <b className="text-white">{selectedRequest.username_or_email}</b> ({selectedRequest.full_name})
                  <br />
                  SĐT: <b className="text-emerald-400">{selectedRequest.contact_phone}</b>
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Ghi chú của Quản trị viên (nếu có):
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ghi chú xác minh danh tính..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(null);
                      setActionType(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  {actionType === 'APPROVE' ? (
                    <button
                      type="button"
                      disabled={processing}
                      onClick={handleApprove}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Xác nhận Duyệt
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={processing}
                      onClick={handleReject}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Xác nhận Từ chối
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
