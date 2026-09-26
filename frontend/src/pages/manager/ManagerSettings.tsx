import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';
import { 
  Bot, 
  Shield, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';

type SystemSettings = {
  latePenaltyMinutes: number;
  latePenaltyPercent: number;
  freeServiceAfterMinutes: number;
  workingStart: string;
  workingEnd: string;
  slotDurationMinutes: number;
  timezone: string;
  technicianSharePercent: number;
  teamSharePercent: number;
  turnstileEnabled?: boolean;
  turnstileSiteKey?: string;
  turnstileSecret?: string;
  telegramEnabled?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramApiUrl?: string;
};

const defaultSettings: SystemSettings = {
  latePenaltyMinutes: 10,
  latePenaltyPercent: 15,
  freeServiceAfterMinutes: 30,
  workingStart: '07:00',
  workingEnd: '19:00',
  slotDurationMinutes: 60,
  timezone: 'Asia/Ho_Chi_Minh',
  technicianSharePercent: 70,
  teamSharePercent: 30,
  turnstileEnabled: false,
  turnstileSiteKey: '',
  turnstileSecret: '',
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  telegramApiUrl: 'https://api.telegram.org',
};

export function ManagerSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Telegram test & detect state
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [detectingChatId, setDetectingChatId] = useState(false);
  const [detectedChatResult, setDetectedChatResult] = useState<{ success: boolean; message: string; chatId?: string; title?: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await managerApi.settings();
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings((prev: SystemSettings) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof SystemSettings) => {
    setSettings((prev: SystemSettings) => ({ ...prev, [field]: Number(e.target.value) }));
  };

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await managerApi.updateSettings(settings);
      if (res.data?.data) {
        setSettings(res.data.data);
      }
      setSuccessMsg('Đã lưu cài đặt hệ thống thành công!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setErrorMsg(error.response?.data?.error?.message || 'Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await managerApi.testTelegram(settings.telegramChatId);
      setTelegramTestResult({ success: true, message: res.data?.message || 'Bắn tin nhắn test thành công!' });
    } catch (error: any) {
      setTelegramTestResult({
        success: false,
        message: error.response?.data?.error?.message || error.response?.data?.message || 'Gửi tin nhắn test thất bại.',
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleDetectChatId = async () => {
    setDetectingChatId(true);
    setDetectedChatResult(null);
    try {
      const res = await managerApi.detectTelegramChatId();
      if (res.data?.data?.chatId) {
        setSettings((prev: SystemSettings) => ({ ...prev, telegramChatId: res.data.data.chatId }));
        setDetectedChatResult({
          success: true,
          message: res.data.message,
          chatId: res.data.data.chatId,
          title: res.data.data.chatTitle,
        });
      } else {
        setDetectedChatResult({
          success: false,
          message: res.data?.message || 'Không tìm thấy Chat ID.',
        });
      }
    } catch (error: any) {
      setDetectedChatResult({
        success: false,
        message: error.response?.data?.error?.message || error.response?.data?.message || 'Lỗi khi quét Chat ID.',
      });
    } finally {
      setDetectingChatId(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="card p-4 sm:p-6"><div className="h-4 bg-gray-200 rounded w-1/3"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-text mb-6">Cài đặt vận hành &amp; Hệ thống</h1>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VẬN HÀNH & TÀI CHÍNH */}
        <div className="card p-4 sm:p-6 md:p-8 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Thông số Lịch hẹn &amp; Tài chính
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Phạt muộn (phút)</label>
              <input name="late_penalty_minutes" type="number" value={settings.latePenaltyMinutes || 10} onChange={e => handleNumberChange(e, 'latePenaltyMinutes')} className="input w-full" />
            </div>
            <div>
              <label className="label">Phần trăm phạt muộn (%)</label>
              <input name="late_penalty_percent" type="number" value={settings.latePenaltyPercent || 15} onChange={e => handleNumberChange(e, 'latePenaltyPercent')} className="input w-full" />
            </div>
            <div>
              <label className="label">Miễn phí sau (phút)</label>
              <input name="free_service_after_minutes" type="number" value={settings.freeServiceAfterMinutes || 30} onChange={e => handleNumberChange(e, 'freeServiceAfterMinutes')} className="input w-full" />
            </div>
            <div>
              <label className="label">Giờ bắt đầu làm việc</label>
              <input name="working_start" type="time" value={settings.workingStart || '07:00'} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="label">Giờ kết thúc làm việc</label>
              <input name="working_end" type="time" value={settings.workingEnd || '19:00'} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="label">Thời lượng slot (phút)</label>
              <input name="slot_duration_minutes" type="number" value={settings.slotDurationMinutes || 60} onChange={e => handleNumberChange(e, 'slotDurationMinutes')} className="input w-full" />
            </div>
            <div>
              <label className="label">Múi giờ</label>
              <input name="timezone" type="text" value={settings.timezone || 'Asia/Ho_Chi_Minh'} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="label">Chia sẻ kỹ thuật viên (%)</label>
              <input name="technician_share_percent" type="number" value={settings.technicianSharePercent || 70} onChange={e => handleNumberChange(e, 'technicianSharePercent')} className="input w-full" />
            </div>
            <div>
              <label className="label">Chia sẻ đội nhóm (%)</label>
              <input name="team_share_percent" type="number" value={settings.teamSharePercent || 30} onChange={e => handleNumberChange(e, 'teamSharePercent')} className="input w-full" />
            </div>
          </div>
        </div>

        {/* BẢO VỆ CHỐNG BOT */}
        <div className="card p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>Bảo vệ chống Bot &amp; Spam Đặt Lịch (Cloudflare Turnstile)</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              settings.turnstileEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${settings.turnstileEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {settings.turnstileEnabled ? 'Đang kích hoạt' : 'Tạm tắt'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Hệ thống Cloudflare Turnstile đang tự động kiểm duyệt bot ngầm trên form đặt lịch của khách hàng. Khóa bảo mật hạ tầng được quản lý bởi Quản trị viên (Admin).
          </p>
        </div>

        {/* TELEGRAM BOT DISPATCHER */}
        <div className="card p-4 sm:p-6 md:p-8 space-y-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <Bot className="w-5 h-5 text-sky-600" />
              <span>Hệ thống Cảnh báo Telegram Bot (@canh_technician_bot)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.telegramEnabled === true}
                onChange={e => setSettings(prev => ({ ...prev, telegramEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-700">
                {settings.telegramEnabled ? 'Đang kích hoạt (Bắn tin)' : 'Tắt thông báo'}
              </span>
            </label>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-sky-800">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Hướng dẫn kết nối Bot vào Group:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Mở Telegram và tìm kiếm bot: <a href="https://t.me/canh_technician_bot" target="_blank" rel="noreferrer" className="text-sky-600 font-bold underline inline-flex items-center gap-0.5">@canh_technician_bot <ExternalLink className="w-3 h-3" /></a></li>
              <li>Thêm <strong>@canh_technician_bot</strong> vào Nhóm Telegram của Kỹ thuật viên &amp; Quản lý.</li>
              <li>Gõ 1 tin nhắn bất kỳ trong nhóm (ví dụ: <code>xin chào</code>), sau đó bấm nút <strong>"Quét Chat ID"</strong> bên dưới.</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">Telegram Bot Token (HTTP API)</label>
              <input
                type="text"
                value={settings.telegramBotToken ?? ''}
                onChange={e => setSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                className="input w-full font-mono text-xs"
                placeholder="VD: 123456789:ABCdefGhI..."
              />
            </div>
            <div>
              <label className="label">Group / Channel Chat ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.telegramChatId ?? ''}
                  onChange={e => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                  className="input flex-1 font-mono text-xs"
                  placeholder="VD: -1002345678901"
                />
                <button
                  type="button"
                  onClick={handleDetectChatId}
                  disabled={detectingChatId}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${detectingChatId ? 'animate-spin' : ''}`} />
                  <span>{detectingChatId ? 'Đang quét...' : 'Quét Chat ID'}</span>
                </button>
              </div>
            </div>
          </div>

          {detectedChatResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              detectedChatResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {detectedChatResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                {detectedChatResult.message}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Kiểm tra bắn thử tin nhắn mẫu vào nhóm Telegram trước khi lưu cấu hình:
            </div>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-pulse' : ''}`} />
              <span>{testingTelegram ? 'Đang gửi tin test...' : '🔔 Bắn tin nhắn Test'}</span>
            </button>
          </div>

          {telegramTestResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              telegramTestResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {telegramTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                {telegramTestResult.message}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={saving} className="btn btn-primary px-8 py-3">
            {saving ? 'Đang lưu...' : 'Lưu tất cả cài đặt'}
          </button>
        </div>
      </form>
    </div>
  );
}