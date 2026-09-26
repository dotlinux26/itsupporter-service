import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/client';
import { Camera, Upload, ZoomIn, ZoomOut, RotateCw, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Avatar } from './Avatar';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string | null;
  userName: string;
  userEmail?: string;
  onSuccess: () => void;
}

export function AvatarUploadModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName,
  userEmail,
  onSuccess,
}: AvatarUploadModalProps) {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setImageSrc(null);
      setZoom(1);
      setRotation(0);
      setError('');
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validMimes.includes(file.type) || !validExts.includes(fileExt)) {
      setError(t('profile.avatarModal.invalidFormat'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('profile.avatarModal.fileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setImageSrc(src);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        drawCroppedCanvas(img, 1, 0);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const drawCroppedCanvas = (img: HTMLImageElement, currentZoom: number, currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // Center point
    ctx.translate(size / 2, size / 2);
    ctx.rotate((currentRotation * Math.PI) / 180);
    ctx.scale(currentZoom, currentZoom);

    // Calculate aspect ratio fill
    const aspect = img.width / img.height;
    let drawWidth = size;
    let drawHeight = size;

    if (aspect > 1) {
      drawWidth = size * aspect;
      drawHeight = size;
    } else {
      drawWidth = size;
      drawHeight = size / aspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (imageRef.current) {
      drawCroppedCanvas(imageRef.current, newZoom, rotation);
    }
  };

  const handleRotate = () => {
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    if (imageRef.current) {
      drawCroppedCanvas(imageRef.current, zoom, nextRotation);
    }
  };

  const handleSaveCropped = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    setError('');

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError(t('profile.avatarModal.cropError'));
        setLoading(false);
        return;
      }

      const croppedFile = new File([blob], 'avatar.png', { type: 'image/png' });

      try {
        await authApi.uploadAvatar(croppedFile);
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.response?.data?.message || err.response?.data?.error?.message || t('profile.avatarModal.uploadFailed'));
      } finally {
        setLoading(false);
      }
    }, 'image/png');
  };

  const handleRemoveAvatar = async () => {
    if (!confirm(t('profile.avatarModal.removeConfirm'))) return;
    setLoading(true);
    setError('');
    try {
      await authApi.updateProfile({ avatarUrl: null });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('profile.avatarModal.removeFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900 text-base">{t('profile.avatarModal.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!imageSrc ? (
            /* Choose file step */
            <div className="flex flex-col items-center justify-center gap-4 py-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-orange-50/30 transition-colors">
              <div className="relative">
                <Avatar
                  src={currentAvatarUrl}
                  name={userName}
                  email={userEmail}
                  size={96}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-gray-800">{t('profile.avatarModal.choosePortrait')}</p>
                <p className="text-xs text-gray-500">{t('profile.avatarModal.fileAcceptNote')}</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition"
                >
                  <Upload className="w-4 h-4" />
                  {t('profile.avatarModal.selectFromFile')}
                </button>

                {currentAvatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('profile.avatarModal.removeAvatar')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Crop & Adjust Step */
            <div className="space-y-4">
              <div className="relative flex items-center justify-center bg-gray-900 rounded-2xl overflow-hidden p-4">
                <div className="relative w-[220px] h-[220px] rounded-full overflow-hidden border-2 border-white/80 shadow-inner">
                  <canvas ref={canvasRef} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-gray-500" />
                    {t('profile.avatarModal.zoom')}
                  </span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-gray-400" />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    {t('profile.avatarModal.rotate90')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-800 transition underline"
                  >
                    {t('profile.avatarModal.chooseAnother')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {imageSrc && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/50 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setImageSrc(null);
              }}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveCropped}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('profile.saving')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('profile.avatarModal.applyAndSave')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
