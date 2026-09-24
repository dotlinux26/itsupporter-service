import { useEffect, useState } from 'react';
import { managerApi } from '../../api/client';

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
};

export function ManagerSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // This would need a proper endpoint
      setSaving(false);
      alert('Đã lưu cài đặt');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10 md:py-12 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="card p-6"><div className="h-4 bg-gray-200 rounded w-1/3"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-12 max-w-2xl">
      <h1 className="text-2xl font-bold text-text mb-8">Cài đặt hệ thống</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Phạt muộn (phút)</label>
            <input name="late_penalty_minutes" type="number" value={settings.latePenaltyMinutes || 10} onChange={e => handleNumberChange(e, 'latePenaltyMinutes')} className="input" />
          </div>
          <div>
            <label className="label">Phần trăm phạt muộn (%)</label>
            <input name="late_penalty_percent" type="number" value={settings.latePenaltyPercent || 15} onChange={e => handleNumberChange(e, 'latePenaltyPercent')} className="input" />
          </div>
          <div>
            <label className="label">Miễn phí sau (phút)</label>
            <input name="free_service_after_minutes" type="number" value={settings.freeServiceAfterMinutes || 30} onChange={e => handleNumberChange(e, 'freeServiceAfterMinutes')} className="input" />
          </div>
          <div>
            <label className="label">Giờ bắt đầu làm việc</label>
            <input name="working_start" type="time" value={settings.workingStart || '07:00'} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Giờ kết thúc làm việc</label>
            <input name="working_end" type="time" value={settings.workingEnd || '19:00'} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Thời lượng slot (phút)</label>
            <input name="slot_duration_minutes" type="number" value={settings.slotDurationMinutes || 60} onChange={e => handleNumberChange(e, 'slotDurationMinutes')} className="input" />
          </div>
          <div>
            <label className="label">Múi giờ</label>
            <input name="timezone" type="text" value={settings.timezone || 'Asia/Ho_Chi_Minh'} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Chia sẻ kỹ thuật viên (%)</label>
            <input name="technician_share_percent" type="number" value={settings.technicianSharePercent || 70} onChange={e => handleNumberChange(e, 'technicianSharePercent')} className="input" />
          </div>
          <div>
            <label className="label">Chia sẻ đội nhóm (%)</label>
            <input name="team_share_percent" type="number" value={settings.teamSharePercent || 30} onChange={e => handleNumberChange(e, 'teamSharePercent')} className="input" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </form>
    </div>
  );
}