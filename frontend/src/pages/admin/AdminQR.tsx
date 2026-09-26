import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/client';
import { ZoomableImage } from '../../components/ImageModal';
import { QrCode, Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export function AdminQR() {
  const { t } = useTranslation();
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [currentQr, setCurrentQr] = useState<string | null>(null);
  const [currentQrId, setCurrentQrId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCurrentQr = async () => {
    try {
      const res = await adminApi.qr.getActive();
      if (res.data.data?.path) {
        setCurrentQr(res.data.data.path);
        setCurrentQrId(res.data.data.id ?? null);
      } else {
        setCurrentQr(null);
        setCurrentQrId(null);
      }
    } catch (err) {
      console.error('Failed to load active QR:', err);
    }
  };

  useEffect(() => {
    loadCurrentQr();
  }, []);

  const handleUpload = async () => {
    if (!qrFile) return;
    setUploading(true);
    setMessage(null);
    try {
      await adminApi.qr.upload(qrFile);
      setMessage({ type: 'success', text: t('admin.qrUploadSuccess') });
      setQrFile(null);
      setPreview(null);
      loadCurrentQr();
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage({ type: 'error', text: t('admin.qrUploadFail') });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentQrId && !window.confirm(t('admin.qrDeleteConfirm'))) return;
    try {
      if (currentQrId) {
        await adminApi.qr.delete(currentQrId);
      }
      setCurrentQr(null);
      setMessage({ type: 'success', text: t('admin.qrDeleteSuccess') });
    } catch (err) {
      console.error('Delete failed:', err);
      setMessage({ type: 'error', text: t('admin.qrDeleteFail') });
    }
  };

  return (
    <div className="container py-5 sm:py-8 md:py-12 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <QrCode className="w-8 h-8 text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold text-text">{t('admin.qrTitle')}</h1>
          <p className="text-sm text-text-secondary">
            {t('admin.qrSubtitle')}
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="card p-6 mb-8 border border-border">
        <h2 className="font-semibold text-text mb-4 flex items-center justify-between">
          <span>{t('admin.qrCurrentActive')}</span>
          {currentQr && (
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-0.5 rounded-full">
              {t('admin.qrInUse')}
            </span>
          )}
        </h2>
        {currentQr ? (
          <div className="text-center py-4">
            <ZoomableImage
              src={currentQr}
              alt="QR Payment"
              className="w-64 h-64 mx-auto rounded-xl border border-border shadow-sm object-contain bg-white p-2"
              title={t('admin.qrCurrentActive')}
              caption={t('admin.qrSubtitle')}
            />
            <p className="text-xs text-text-muted mt-1">
              ({t('common.clickToEnlarge', '(Nhấn vào ảnh để phóng to toàn màn hình)')})
            </p>
            <p className="text-sm text-text-secondary mt-2">
              {t('admin.qrSubtitle')}
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">{t('admin.qrNoActive')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('admin.qrHint')}</p>
          </div>
        )}
      </div>

      <div className="card p-6 border border-border">
        <h2 className="font-semibold text-text mb-4">{t('admin.qrUploadNew')}</h2>
        <div className="space-y-4">
          <div>
            <label className="label">{t('admin.qrChooseFile')} (PNG, JPG, WEBP - max 5MB)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setQrFile(file);
                  setPreview(URL.createObjectURL(file));
                }
              }}
              className="input"
            />
          </div>

          {preview && (
            <div className="text-center py-2">
              <p className="text-xs font-medium text-text-muted mb-2">{t('admin.preview', 'Xem trước ảnh QR:')}</p>
              <img
                src={preview}
                alt="Preview"
                className="w-48 h-48 mx-auto rounded-lg border border-border object-contain bg-white p-2 shadow-sm"
              />
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !qrFile}
              className="btn btn-primary flex items-center gap-2"
              type="button"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? t('admin.qrUploading') : t('admin.qrUploadAndActivate')}
            </button>

            {currentQr && (
              <button
                onClick={handleDelete}
                className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 flex items-center gap-1.5"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
                {t('admin.qrDelete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}